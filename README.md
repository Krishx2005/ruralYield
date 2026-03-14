# RuralYield FinOps

**Agentic Finance Platform for Rural Innovation Bonds**

RuralYield connects rural farmers with micro-investors through AI-powered "Local Innovation Bonds." Farmers describe their agricultural innovations via voice, and an autonomous agent validates, scores, and lists bonds — all through a voice-first interface.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + Vite)                  │
│  ┌──────────────┐  ┌──────────────────┐  ┌─────────────────┐   │
│  │   Farmer     │  │    Investor      │  │   Bond Detail   │   │
│  │  Dashboard   │  │   Dashboard      │  │     Page        │   │
│  │ (Voice-First)│  │  (Marketplace)   │  │  (Audit Trail)  │   │
│  └──────┬───────┘  └────────┬─────────┘  └───────┬─────────┘   │
└─────────┼──────────────────┼─────────────────────┼─────────────┘
          │                  │                     │
          ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND (FastAPI)                            │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              JASECI AGENT DECISION LOOP                  │    │
│  │  ┌────────┐ ┌──────────┐ ┌──────┐ ┌────────┐ ┌──────┐  │    │
│  │  │ Intake │→│Compliance│→│ Risk │→│Decision│→│Notify│  │    │
│  │  └────────┘ └──────────┘ └──────┘ └────────┘ └──────┘  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌──────────┐ ┌────────────┐ ┌─────────┐ ┌──────────────┐      │
│  │ElevenLabs│ │Featherless │ │   AWS   │ │    USDA      │      │
│  │  Voice   │ │  Llama 3   │ │ Bedrock │ │  Crop Data   │      │
│  └──────────┘ └────────────┘ └─────────┘ └──────────────┘      │
└─────────────────────────────────────────────────────────────────┘
          │                  │                     │
          ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AWS SERVICES                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │ DynamoDB │ │    S3    │ │  Lambda  │ │   API Gateway   │   │
│  │ (Bonds,  │ │  (Docs)  │ │ (Ledger) │ │   (REST API)    │   │
│  │  Ledger) │ │          │ │          │ │                  │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Sponsor Technologies

### AWS (4+ services, 1 AI/ML)
- **AWS Bedrock** (AI/ML) — Risk scoring using Claude Sonnet. Analyzes bond proposals against USDA agricultural data to produce risk assessments
- **DynamoDB** — Primary datastore for bonds, ledger transactions, and user profiles
- **Lambda** — Serverless ledger updates triggered when bonds are funded
- **API Gateway** — RESTful API exposure for Lambda functions
- **S3** — Document and crop photo storage for bond proposals

### ElevenLabs (Voice-First Interface)
- **Speech-to-Text**: Farmers dictate bond proposals via voice — the app transcribes and auto-fills forms
- **Text-to-Speech**: Agent decisions are spoken back to farmers; investors can hear bond summaries read aloud
- Voice is central to the UX — designed for farmers who may prefer speaking over typing

### Featherless.AI (Compliance LLM)
- **Model**: meta-llama/Llama-3.1-8B-Instruct via Featherless inference API
- **Purpose**: Regulatory compliance checking for bond proposals
- **Why Llama 3 over GPT-4**: Open-weight model enables transparency in compliance decisions; lower cost per inference suits micro-transaction economics; no vendor lock-in for sensitive financial analysis; community-auditable model weights align with cooperative finance values

### Jaseci (Agent Framework)
- **Agent Decision Loop**: Autonomous multi-step pipeline that intake → comply → score → decide → notify
- **Walker Pattern**: Bond processor traverses a graph of decision nodes
- Implements auditable, explainable AI decisions with full step-by-step trail

## Setup Instructions

### Prerequisites
- Python 3.11+
- Node.js 18+
- AWS account with Bedrock, DynamoDB, Lambda, S3 access
- ElevenLabs API key (https://elevenlabs.io)
- Featherless.AI API key (https://featherless.ai)

### 1. Clone and configure
```bash
cp .env.example .env
# Edit .env with your API keys
```

### 2. Backend setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 3. Frontend setup
```bash
cd frontend
npm install
npm run dev
```

### 4. AWS Setup
```bash
# Create DynamoDB tables
aws dynamodb create-table --table-name ruralbonds \
  --attribute-definitions AttributeName=bond_id,AttributeType=S \
  --key-schema AttributeName=bond_id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST

aws dynamodb create-table --table-name ruralledger \
  --attribute-definitions AttributeName=transaction_id,AttributeType=S \
  --key-schema AttributeName=transaction_id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST

# Deploy Lambda
cd lambda
zip ledger_updater.zip ledger_updater.py
aws lambda create-function --function-name ledger-updater \
  --runtime python3.11 --handler ledger_updater.lambda_handler \
  --zip-file fileb://ledger_updater.zip \
  --role arn:aws:iam::YOUR_ACCOUNT:role/lambda-role
```

## Running Locally (Demo Mode)

The app works without real API keys — all external services have mock fallbacks that return realistic demo data. Just run:

```bash
# Terminal 1
cd backend && pip install -r requirements.txt && uvicorn main:app --reload

# Terminal 2
cd frontend && npm install && npm run dev
```

Open http://localhost:5173

## Agent Decision Logic

The autonomous agent follows this decision tree:

```
IF compliance_score >= 70 AND risk_level != HIGH:
    → APPROVE bond for marketplace listing
    → Create ledger entry via Lambda

IF compliance_score < 70:
    → REQUEST_MORE_INFO
    → Return specific compliance feedback to farmer

IF risk_level == HIGH:
    → REJECT bond
    → Return risk reasoning to farmer
```

### Limitations
- USDA data is fetched from QuickStats API with DEMO_KEY (rate limited)
- Compliance scoring via Llama 3 may produce variable results across runs
- Risk scoring depends on Bedrock availability; mock fallback uses heuristic scoring
- Voice transcription accuracy depends on audio quality and network conditions

## Demo Script (3 minutes)

1. **Farmer creates bond via voice** (30s): Click mic → speak "I want to raise $15,000 for my corn innovation in Franklin County Ohio" → form auto-fills
2. **Agent processes bond** (45s): Submit → watch 8 agent steps animate (intake → USDA fetch → compliance → risk → decision → DynamoDB write → Lambda trigger → voice response)
3. **Farmer hears decision** (15s): Agent approves → ElevenLabs speaks the decision
4. **Investor marketplace** (30s): Switch to investor view → see bond with risk badge + USDA data + compliance score
5. **Investment flow** (30s): Click Invest → Lambda fires → ledger updates → bond status changes to FUNDED
6. **Bond detail audit** (30s): Click bond → see full compliance report, risk reasoning, agent audit trail, ledger history

## ElevenLabs Integration Reference
- [ElevenLabs API Docs](https://elevenlabs.io/docs)
- Speech-to-Text: POST /v1/speech-to-text (model: scribe_v1)
- Text-to-Speech: POST /v1/text-to-speech/{voice_id}
- Default voice: Bella (EXAVITQu4vr4xnSDxMaL)
