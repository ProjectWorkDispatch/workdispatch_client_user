export const sanitizeLettersOnly = (value) =>
  value.replace(/[^a-zA-ZÀ-ÿñÑ\s]/g, "");

export const sanitizePhone = (value) =>
  value.replace(/[^0-9+\-\s()]/g, "");

export const blockInvalidNumberKeys = (e) => {
  if (["e", "E", "+", "-"].includes(e.key)) {
    e.preventDefault();
  }
};
