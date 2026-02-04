import logging

logger = logging.getLogger(__name__)

async def send_email(to_email: str, subject: str, body: str):
    """
    Send an email. 
    Currently mocked to log to console, but ready for SMTP integration.
    """
    logger.info(f"--- MOCK EMAIL SEND ---")
    logger.info(f"To: {to_email}")
    logger.info(f"Subject: {subject}")
    logger.info(f"Body: {body}")
    logger.info(f"-----------------------")
    
    # In a real implementation:
    # msg = EmailMessage()
    # msg.set_content(body)
    # ...
    # await aiosmtplib.send(...)
    
    return True

async def send_password_reset_email(to_email: str, token: str):
    link = f"http://localhost:3000/reset-password?token={token}"
    subject = "Password Reset Request"
    body = f"""
    Hello,
    
    You requested a password reset. Please click the link below to reset your password:
    
    {link}
    
    If you did not request this, please ignore this email.
    """
    await send_email(to_email, subject, body)

async def send_invite_email(to_email: str, password: str, inviter_name: str = "Administrator"):
    link = "http://localhost:3000/login"
    subject = "You have been invited to C(AI)DENCE"
    body = f"""
    Hello,
    
    {inviter_name} has invited you to join the C(AI)DENCE platform.
    
    Your temporary credentials are:
    Email: {to_email}
    Password: {password}
    
    Please log in at: {link}
    
    We recommend changing your password after your first login.
    """
    await send_email(to_email, subject, body)
