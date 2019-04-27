export function getAllKeywords(){
  fetch("http://localhost:8000/all_keywords", {
    method: "GET",
  }).then(response => response.json())
    .then(response => response)
    .catch(e => console.error("TODO handle error " + e));
}