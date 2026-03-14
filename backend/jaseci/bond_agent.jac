"""
RuralYield Bond Agent — Jaseci Walker Definition

This agent defines the bond processing pipeline as a graph-based walker.
The walker traverses through nodes representing each stage of the
bond evaluation process: intake -> compliance -> risk -> decision -> notify.
"""

node intake {
    has title: str = "";
    has amount: float = 0.0;
    has crop_type: str = "";
    has county: str = "";
    has description: str = "";
}

node compliance {
    has compliance_score: int = 0;
    has missing_disclosures: list = [];
    has jurisdiction_risks: list = [];
    has suggested_fixes: list = [];
    has summary: str = "";
}

node risk {
    has risk_level: str = "MEDIUM";
    has risk_score: int = 50;
    has reasoning: str = "";
    has usda_yield_avg: float = 0.0;
}

node decision {
    has status: str = "PENDING";
    has reason: str = "";
    has bond_id: str = "";
}

node notify {
    has voice_response_generated: bool = False;
    has ledger_entry_created: bool = False;
}

edge pipeline {}

walker bond_processor {
    """
    Main bond processing walker.
    Traverses the pipeline graph from intake through to notification.
    At each node, it calls the appropriate service tool and records results.
    """

    has proposal: dict = {};
    has audit_trail: list = [];
    has final_decision: str = "PENDING";

    can process_intake with intake entry {
        # Populate the intake node from the proposal
        here.title = self.proposal.get("title", "");
        here.amount = self.proposal.get("amount", 0.0);
        here.crop_type = self.proposal.get("crop_type", "");
        here.county = self.proposal.get("county", "");
        here.description = self.proposal.get("description", "");

        self.audit_trail.append({
            "step": "intake",
            "status": "received",
            "title": here.title
        });

        visit [-->];
    }

    can check_compliance with compliance entry {
        # Call Featherless.AI compliance check via tool
        result = tools.run_compliance_check(self.proposal);
        here.compliance_score = result.get("compliance_score", 0);
        here.missing_disclosures = result.get("missing_disclosures", []);
        here.jurisdiction_risks = result.get("jurisdiction_risks", []);
        here.suggested_fixes = result.get("suggested_fixes", []);
        here.summary = result.get("summary", "");

        self.audit_trail.append({
            "step": "compliance",
            "score": here.compliance_score,
            "status": "checked"
        });

        visit [-->];
    }

    can assess_risk with risk entry {
        # Call Bedrock risk scoring via tool
        usda_data = tools.fetch_usda_data(
            self.proposal.get("crop_type", ""),
            self.proposal.get("county", "")
        );
        here.usda_yield_avg = usda_data.get("yield_avg", 0.0);

        result = tools.run_risk_score(self.proposal, usda_data);
        here.risk_level = result.get("risk_level", "MEDIUM");
        here.risk_score = result.get("risk_score", 50);
        here.reasoning = result.get("reasoning", "");

        self.audit_trail.append({
            "step": "risk",
            "risk_level": here.risk_level,
            "risk_score": here.risk_score,
            "status": "scored"
        });

        visit [-->];
    }

    can make_decision with decision entry {
        # Apply decision rules
        compliance_node = tools.get_previous_node("compliance");
        risk_node = tools.get_previous_node("risk");

        c_score = compliance_node.compliance_score if compliance_node else 0;
        r_level = risk_node.risk_level if risk_node else "HIGH";

        if c_score >= 70 and r_level != "HIGH" {
            here.status = "APPROVED";
            here.reason = f"Compliance {c_score}/100 meets threshold. Risk {r_level} acceptable.";
        } elif c_score < 70 {
            here.status = "REQUEST_MORE_INFO";
            here.reason = f"Compliance {c_score}/100 below threshold. More info needed.";
        } else {
            here.status = "REJECTED";
            here.reason = f"Risk level {r_level} is too high.";
        }

        # Write to DynamoDB
        here.bond_id = tools.write_bond_to_db(self.proposal, here.status, here.reason);

        self.final_decision = here.status;

        self.audit_trail.append({
            "step": "decision",
            "status": here.status,
            "reason": here.reason,
            "bond_id": here.bond_id
        });

        visit [-->];
    }

    can send_notification with notify entry {
        # If approved, trigger Lambda ledger entry
        if self.final_decision == "APPROVED" {
            tools.trigger_lambda_ledger(
                tools.get_previous_node("decision").bond_id,
                "SYSTEM",
                self.proposal.get("amount", 0)
            );
            here.ledger_entry_created = True;
        }

        # Generate voice response
        here.voice_response_generated = tools.generate_voice_response(
            self.final_decision,
            self.proposal.get("title", "")
        );

        self.audit_trail.append({
            "step": "notify",
            "ledger_created": here.ledger_entry_created,
            "voice_generated": here.voice_response_generated,
            "status": "complete"
        });
    }
}

# Build the pipeline graph
graph bond_pipeline {
    has entry = spawn intake;
    comp = spawn compliance;
    rsk = spawn risk;
    dec = spawn decision;
    ntf = spawn notify;

    entry +[pipeline]+> comp;
    comp +[pipeline]+> rsk;
    rsk +[pipeline]+> dec;
    dec +[pipeline]+> ntf;
}
