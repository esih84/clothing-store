export const createSlug = (str: string) => {
  return str
    ?.replace(/[[ًٌٍَُِّء\.\+\-_@!#$%^&*-`~"'><]+/g, "")
    ?.replace(/[\s]+/g, "-");
};

export const randomId = () => Math.random().toString(36).substring(2);
