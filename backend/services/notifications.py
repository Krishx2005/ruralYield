import os
import logging

logger = logging.getLogger("ruralyield.services.notifications")


async def send_email_notification(to_email: str, subject: str, body: str) -> bool:
    """Send email via AWS SES. Falls back to logging if unavailable."""
    if not to_email:
        logger.info("No email address provided, skipping email notification")
        return False

    try:
        import boto3
        ses = boto3.client("ses", region_name=os.getenv("AWS_DEFAULT_REGION", "us-east-1"))
        ses.send_email(
            Source=os.getenv("SES_FROM_EMAIL", "noreply@ruralyield.com"),
            Destination={"ToAddresses": [to_email]},
            Message={
                "Subject": {"Data": subject},
                "Body": {"Text": {"Data": body}},
            },
        )
        logger.info("Email sent to %s: %s", to_email, subject)
        return True
    except Exception as exc:
        logger.info("SES unavailable (%s), logging notification instead:", exc)
        logger.info("EMAIL TO: %s | SUBJECT: %s | BODY: %s", to_email, subject, body)
        return False


async def send_sms_notification(to_phone: str, message: str) -> bool:
    """Send SMS via AWS SNS. Falls back to logging if unavailable."""
    if not to_phone:
        logger.info("No phone number provided, skipping SMS notification")
        return False

    try:
        import boto3
        sns = boto3.client("sns", region_name=os.getenv("AWS_DEFAULT_REGION", "us-east-1"))
        sns.publish(
            PhoneNumber=to_phone,
            Message=message,
        )
        logger.info("SMS sent to %s", to_phone)
        return True
    except Exception as exc:
        logger.info("SNS unavailable (%s), logging notification instead:", exc)
        logger.info("SMS TO: %s | MESSAGE: %s", to_phone, message)
        return False


async def notify_bond_approved(bond: dict):
    """Notify farmer when bond is approved."""
    title = bond.get("title", "Untitled Bond")
    email = bond.get("farmer_email", "")
    phone = bond.get("farmer_phone", "")
    await send_email_notification(
        email,
        f"Your bond '{title}' has been approved!",
        f"Great news! Your bond '{title}' has been approved and is now listed on the RuralYield marketplace."
    )
    await send_sms_notification(phone, f"RuralYield: Your bond '{title}' has been approved and is now listed!")


async def notify_investment_received(bond: dict, investor_name: str, investor_email: str, amount: float):
    """Notify farmer and investor when investment is made."""
    title = bond.get("title", "Untitled Bond")
    farmer_email = bond.get("farmer_email", "")
    fmt_amount = f"${amount:,.2f}"

    # Notify farmer
    await send_email_notification(
        farmer_email,
        f"You received a {fmt_amount} investment on '{title}'!",
        f"An investor ({investor_name}) has invested {fmt_amount} in your bond '{title}'. "
        f"Check your dashboard for details."
    )

    # Notify investor
    await send_email_notification(
        investor_email,
        f"Your {fmt_amount} investment in '{title}' is confirmed!",
        f"Your investment of {fmt_amount} in '{title}' has been recorded. "
        f"You can track your portfolio on RuralYield."
    )


async def notify_bond_fully_funded(bond: dict):
    """Notify farmer when bond is fully funded."""
    title = bond.get("title", "Untitled Bond")
    amount = bond.get("funding_goal", bond.get("amount", 0))
    email = bond.get("farmer_email", "")
    phone = bond.get("farmer_phone", "")
    fmt_amount = f"${amount:,.2f}"

    await send_email_notification(
        email,
        f"Congratulations! '{title}' is fully funded!",
        f"Your bond '{title}' is fully funded at {fmt_amount}! "
        f"Thank you for being part of the RuralYield community."
    )
    await send_sms_notification(phone, f"RuralYield: Congratulations! '{title}' is fully funded at {fmt_amount}!")
