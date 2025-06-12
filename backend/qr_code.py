import segno

def create_qrcode(address: str, path: str) -> None:
    """ Создаем qr-code на указанный address, сохраняя в path"""
    qr_code = segno.make_qr(address)
    qr_code.save(path)