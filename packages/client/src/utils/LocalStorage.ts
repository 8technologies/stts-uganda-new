const getData = (key: string): unknown | undefined => {
  try {
    if (typeof localStorage === "undefined") {
      return undefined;
    }
    const data = localStorage.getItem(key);

    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Read from local storage", error);
  }
};

const setData = (key: string, value: unknown): void => {
  try {
    if (typeof localStorage === "undefined") {
      return;
    }
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Save in local storage", error);
  }
};

export { getData, setData };
