import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

async  def send_email(mail_user, mail_password, to_email, header, body):
    """
    Отправка письма по электронной почте с использованием SMTP-сервера Яндекса
    :param mail_user: почта адресанта
    :param mail_password: специальный пароль адресанта
    :param to_email: почта адресата
    :param header: заголовок письма
    :param body: текст письма
    :return:
    """
    SMTP_SERVER = "smtp.yandex.com"
    SMTP_PORT = 587

    msg = MIMEMultipart()
    msg["From"] = mail_user
    msg["To"] = to_email
    msg["Subject"] = header
    msg.attach(MIMEText(body, "plain"))

    with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
        server.starttls()
        server.login(mail_user, mail_password)  # Авторизация
        server.sendmail(mail_user, to_email, msg.as_string())  # Отправляем письмо


    print(f"Письмо отправлено на {to_email}")