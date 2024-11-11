// const weeks = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
// const months = [
//   "January",
//   "February",
//   "March",
//   "April",
//   "May",
//   "June",
//   "July",
//   "August",
//   "September",
//   "October",
//   "November",
//   "December"
// ];
// let eventsArr = [];
// let nav = 0;
// let clicked = null;
// let theme = "light";
// const calendar = document.getElementById("calendar");
// const week = document.getElementById("week");
// const displayMonth = document.getElementById("displayMonth");
// const displayYear = document.getElementById("displayYear");
// const modal = document.getElementById("modal");
// const mDate = document.getElementById("mDate");
// const mMonth = document.getElementById("mMonth");
// const mYear = document.getElementById("mYear");
// const mDay = document.getElementById("mDay");
// const eventName = document.getElementById("eventName");
// const eventDesc = document.getElementById("eventDesc");
// const allEvents = document.getElementById("allEvents");

// document.addEventListener("DOMContentLoaded", init);


// function init() {
//   loadWeekDays();
//   loadMonth();
// }

// function loadWeekDays() {
//   weeks.forEach((weekDay) => {
//     const weekDayElement = document.createElement("div");
//     weekDayElement.classList.add("week");
//     weekDayElement.innerText = weekDay;
//     week.appendChild(weekDayElement);
//   });
// }

// async function loadMonth() {
//   calendar.innerHTML = '';
//   const dt = new Date();

//   if (nav !== 0) {
//     dt.setMonth(new Date().getMonth() + nav);
//   }

//   const day = dt.getDate();
//   const month = dt.getMonth();
//   const year = dt.getFullYear();
//   const firstDayOfMonth = new Date(year, month, 1);
//   const daysInMonth = new Date(year, month + 1, 0).getDate();
//   const dateString = firstDayOfMonth.toLocaleDateString("en-us", {
//     weekday: "long",
//     year: "numeric",
//     month: "numeric",
//     day: "numeric"
//   });

//   const paddingDays = weeks.indexOf(dateString.split(", ")[0]);

//   displayMonth.innerText = months[month];
//   displayYear.innerText = year;

//   for (let i = 1; i <= paddingDays + daysInMonth; i++) {
//     const daySquare = document.createElement("div");
//     daySquare.classList.add("box");

//     if (i > paddingDays) {
//       daySquare.innerText = i - paddingDays;
//       const eventForDay = eventsArr.find(
//         (e) =>
//           e.day === i - paddingDays && e.month === month + 1 && e.year === year
//       );
//       const events = await fetch(`/events?day=${i - paddingDays}&month=${month + 1}&year=${year}`)
//         .then(response => response.json()); 

//       if (eventForDay) {
//         daySquare.classList.add("event");
//       }

//       if (i - paddingDays === day && nav === 0) {
//         daySquare.id = "currentDay";
//         daySquare.classList.add("today");
//       }

//       daySquare.addEventListener("click", () => showModal(i - paddingDays, month + 1, year));
//     } else {
//       daySquare.classList.add("padding");
//     }

//     calendar.appendChild(daySquare);
//   }
// }
// function showModal(day, month, year) {
//   clicked = { day, month, year };
//   const eventForDay = eventsArr.filter(
//     (e) => e.day === day && e.month === month && e.year === year
//   );

//   mDate.innerText = day;
//   mMonth.innerText = months[month - 1];
//   mYear.innerText = year;
//   mDay.innerText = weeks[new Date(year, month - 1, day).getDay()];

//   allEvents.innerHTML = '';

//   if (eventForDay.length > 0) {
//     eventForDay.forEach((event) => {
//       const eventElement = document.createElement("div");
//       eventElement.classList.add("event-item");

//       const eventDesc = document.createElement("div");
//       eventDesc.classList.add("event-desc");

//       const eventTitle = document.createElement("p");
//       eventTitle.innerText = event.title;

//       const eventDescription = document.createElement("p");
//       eventDescription.innerText = event.description;

//       eventDesc.appendChild(eventTitle);
//       eventDesc.appendChild(eventDescription);
//       eventElement.appendChild(eventDesc);

//       const deleteButton = document.createElement("button");
//       deleteButton.innerText = "Delete";
//       deleteButton.addEventListener("click", () => deleteEvent(event.title));

//       eventElement.appendChild(deleteButton);

//       allEvents.appendChild(eventElement);
//     });
//   }

//   modal.classList.remove("hide-modal");
//   modal.classList.add("show-modal");
// }

// function hideModal() {
//   modal.classList.remove("show-modal");
//   modal.classList.add("hide-modal");
//   eventName.value = '';
//   eventDesc.value = '';
// }

// async function addEvent() {
//   if (eventName.value.trim()) {
//     const event = {
//       day: clicked.day,
//       month: clicked.month,
//       year: clicked.year,
//       title: eventName.value.trim(),
//       description: eventDesc.value.trim()
//     };

//     await fetch('/events', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json'
//       },
//       body: JSON.stringify(event)
//     });

//     hideModal();
//     loadMonth();
//   }
// }

// async function deleteEvent(title) {
//   eventsArr = eventsArr.filter(
//     (e) => !(e.day === clicked.day && e.month === clicked.month && e.year === clicked.year && e.title === title)
//   );
//   showModal(clicked.day, clicked.month, clicked.year);
//   await fetch('/events', {
//     method: 'DELETE',
//     headers: {
//       'Content-Type': 'application/json'
//     },
//     body: JSON.stringify({
//       day: clicked.day,
//       month: clicked.month,
//       year: clicked.year,
//       title
//     })
//   })
// };

// function prevMonth() {
//   nav--;
//   loadMonth();
// }

// function nextMonth() {
//   nav++;
//   loadMonth();
// }

// function changeTheme() {
//   if (theme === "light") {
//     theme = "dark";
//     document.body.classList.add("dark");
//   } else {
//     theme = "light";
//     document.body.classList.remove("dark");
//   }
// }







const weeks = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
let eventsArr = [];
let nav = 0;
let clicked = null;
let theme = "light";

const calendar = document.getElementById("calendar");
const week = document.getElementById("week");
const displayMonth = document.getElementById("displayMonth");
const displayYear = document.getElementById("displayYear");
const modal = document.getElementById("modal");
const mDate = document.getElementById("mDate");
const mMonth = document.getElementById("mMonth");
const mYear = document.getElementById("mYear");
const mDay = document.getElementById("mDay");
const eventName = document.getElementById("eventName");
const eventDesc = document.getElementById("eventDesc");
const allEvents = document.getElementById("allEvents");

document.addEventListener("DOMContentLoaded", init);

function init() {
  loadWeekDays();
  loadMonth();
}

function loadWeekDays() {
  week.innerHTML = '';
  weeks.forEach((weekDay) => {
    const weekDayElement = document.createElement("div");
    weekDayElement.classList.add("week");
    weekDayElement.innerText = weekDay;
    week.appendChild(weekDayElement);
  });
}

async function loadMonth() {
  calendar.innerHTML = '';
  const dt = new Date();

  if (nav !== 0) {
    dt.setMonth(new Date().getMonth() + nav);
  }

  const day = dt.getDate();
  const month = dt.getMonth();
  const year = dt.getFullYear();
  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const paddingDays = firstDayOfMonth.getDay();

  displayMonth.innerText = months[month];
  displayYear.innerText = year;

  for (let i = 1; i <= paddingDays + daysInMonth; i++) {
    const daySquare = document.createElement("div");
    daySquare.classList.add("box");

    if (i > paddingDays) {
      const dayNumber = i - paddingDays;
      daySquare.innerText = dayNumber;

      const eventForDay = eventsArr.find(
        (e) => e.day === dayNumber && e.month === month + 1 && e.year === year
      );

      const events = await fetch(`/events?day=${dayNumber}&month=${month + 1}&year=${year}`)
        .then(response => response.json());

      if (eventForDay) {
        daySquare.classList.add("event");
      }

      if (dayNumber === day && nav === 0) {
        daySquare.id = "currentDay";
        daySquare.classList.add("today");
      }

      daySquare.addEventListener("click", () => showModal(dayNumber, month + 1, year));
    } else {
      daySquare.classList.add("padding");
    }

    calendar.appendChild(daySquare);
  }
}

function showModal(day, month, year) {
  clicked = { day, month, year };
  const eventForDay = eventsArr.filter(
    (e) => e.day === day && e.month === month && e.year === year
  );

  mDate.innerText = day;
  mMonth.innerText = months[month - 1];
  mYear.innerText = year;
  mDay.innerText = weeks[new Date(year, month - 1, day).getDay()];

  allEvents.innerHTML = '';

  if (eventForDay.length > 0) {
    eventForDay.forEach((event) => {
      const eventElement = document.createElement("div");
      eventElement.classList.add("event-item");

      const eventDesc = document.createElement("div");
      eventDesc.classList.add("event-desc");
      // const eventDes = document.createElement("div");
      // eventDesc.classList.add("event-des");

      const eventTitle = document.createElement("p");
      eventTitle.innerText = event.title;

      const eventDescription = document.createElement("p");
      eventDescription.innerText = event.description;

      eventDesc.appendChild(eventTitle);
      eventDesc.appendChild(eventDescription);
      eventElement.appendChild(eventDesc);

      const deleteButton = document.createElement("button");
      deleteButton.innerText = "Delete";
      deleteButton.addEventListener("click", () => deleteEvent(event.title));

      eventElement.appendChild(deleteButton);

      allEvents.appendChild(eventElement);
    });
  }

  modal.classList.remove("hide-modal");
  modal.classList.add("show-modal");
}

function hideModal() {
  modal.classList.remove("show-modal");
  modal.classList.add("hide-modal");
  eventName.value = '';
  eventDesc.value = '';
 
}

async function addEvent() {
  if (eventName.value.trim()) {
    const event = {
      day: clicked.day,
      month: clicked.month,
      year: clicked.year,
      title: eventName.value.trim(),
      description: eventDesc.value.trim(),
      recipient_email: document.getElementById("eventDes").value
    };

    await fetch('/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    });

    hideModal();
    loadMonth();
  }
}

async function deleteEvent(title) {
  eventsArr = eventsArr.filter(
    (e) => !(e.day === clicked.day && e.month === clicked.month && e.year === clicked.year && e.title === title)
  );
  showModal(clicked.day, clicked.month, clicked.year);
  await fetch('/events', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      day: clicked.day,
      month: clicked.month,
      year: clicked.year,
      title
    })
  });
}

function prevMonth() {
  nav--;
  loadMonth();
}

function nextMonth() {
  nav++;
  loadMonth();
}

function changeTheme() {
  if (theme === "light") {
    theme = "dark";
    document.body.classList.add("dark");
  } else {
    theme = "light";
    document.body.classList.remove("dark");
  }
 }


 