export const fetcher = (data) => (url) =>
  fetch(url, data)
    .then((res) => {
      if (res.status >= 300) {
        throw new Error("API Client error");
      }
      return res.json();
    })
    .catch((err) => {
      return err.json();
    });
