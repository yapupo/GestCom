// Gera payload PIX EMV (BR Code) estático com valor.
// Referência: Manual do Banco Central do Brasil — BR Code.

function tlv(id: string, value: string) {
  const len = value.length.toString().padStart(2, "0");
  return `${id}${len}${value}`;
}

function crc16(payload: string) {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function sanitize(text: string, max: number) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9 ]/g, "")
    .toUpperCase()
    .slice(0, max);
}

export interface PixInput {
  key: string;              // Chave (CPF apenas dígitos, e-mail, etc.)
  amount: number;           // R$
  merchantName: string;
  merchantCity: string;
  txid?: string;            // máx 25 chars alfanuméricos
}

export function buildPixPayload({ key, amount, merchantName, merchantCity, txid = "***" }: PixInput) {
  const gui = tlv("00", "br.gov.bcb.pix");
  const k = tlv("01", key);
  const merchantAccount = tlv("26", gui + k);

  const amountStr = amount.toFixed(2);
  const txidClean = sanitize(txid, 25) || "***";
  const additional = tlv("62", tlv("05", txidClean));



  const full =
    tlv("00", "01") +
    merchantAccount +
    tlv("52", "0000") +                                // MCC
    tlv("53", "986") +                                 // BRL
    tlv("54", amountStr) +
    tlv("58", "BR") +
    tlv("59", sanitize(merchantName, 25)) +
    tlv("60", sanitize(merchantCity, 15)) +
    additional +
    "6304";

  return full + crc16(full);
}

export const PIX_DEFAULTS = {
  key: "09596269305", // CPF informado (apenas dígitos)
  merchantName: "EMPADA BETONEIRA",
  merchantCity: "SAO PAULO",
};
