import('file:///c:/Flee/docs/app.js').then(app => {
  console.log("App loaded successfully!");
}).catch(err => {
  console.error("Error loading app:", err);
});
