// Database connection variable
let db;

// Connect to indexed db and open budget_tracker database v1
const request = indexedDB.open("budget_tracker", 1);

// executes when database version changes
request.onupgradeneeded = function (event) {
  // database reference
  const db = event.target.result;
  // create 'new_money' object store and give it auto incrementing ids
  db.createObjectStore("new_money", { autoIncrement: true });
};

// executes when db is succesfully connected
request.onsuccess = function (event) {
  // database reference
  db = event.target.result;

  // check for online status
  if (navigator.onLine) {
    uploadMoney();
  }
};

//Error log
request.onerror = function (event) {
  console.log(event.target.errorCode);
};

// Save records when there is no connection
function saveRecord(record) {
  //open new readwrite db transaction
  const transaction = db.transaction(["new_money"], "readwrite");

  // access `new_money` object store
  const moneyObjectStore = transaction.objectStore("new_money");

  // add record to store with
  moneyObjectStore.add(record);
  alert(
    "Transaction saved! We will submit this transaction when an internet connection is established."
  );
}

function uploadMoney() {
  // open transactoin
  const transaction = db.transaction(["new_money"], "readwrite");

  // access object store
  const moneyObjectStore = transaction.objectStore("new_money");

  // get all records from store
  const getAll = moneyObjectStore.getAll();

  //executes if getAll succeeds
  getAll.onsuccess = function () {
    // send data to API server
    if (getAll.result.length > 0) {
      fetch("/api/transaction", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((serverResponse) => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          // open transaction
          const transaction = db.transaction(["new_money"], "readwrite");
          // access new_money object store
          const moneyObjectStore = transaction.objectStore("new_money");
          // clear all items in new_money object store
          moneyObjectStore.clear();

          alert("All saved transactions has been submitted!");
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };
}

// listen for online status
window.addEventListener("online", uploadMoney);
