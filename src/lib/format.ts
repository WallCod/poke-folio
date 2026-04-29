export const formatCurrency = (value: number, currency: "BRL" | "USD" = "BRL") => {
  return new Intl.NumberFormat(currency === "BRL" ? "pt-BR" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatNumber = (value: number) =>
  new Intl.NumberFormat("pt-BR").format(value);
