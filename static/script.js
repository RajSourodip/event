
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

  const allEvents = document.getElementById("userEventsList");

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
  document.getElementById("schoolName").innerHTML="";
  document.getElementById("district").innerHTML="";
  document.getElementById("mobileNumber").innerHTML="";
  document.getElementById("email").innerHTML="";
 
}

async function addEvent() {
  const eventStatus = document.getElementById("eventStatus");
  const schoolName = document.getElementById("schoolName");
  const district = document.getElementById("district");
  const mobileNumber = document.getElementById("mobileNumber");
  const email = document.getElementById("email");

  if (schoolName.value.trim() && district.value.trim() && mobileNumber.value.trim() && email.value.trim()) {
    const event = {
      day: clicked.day,
      month: clicked.month,
      year: clicked.year,
      schoolName: schoolName.value.trim(),
      district: district.value.trim(),
      mobileNumber: mobileNumber.value.trim(),
      email: email.value.trim()
    };
    console.log(event);
    
    // Show "registering event" message
    eventStatus.innerText = "Registering event...";
    eventStatus.classList.add("show");
    eventStatus.classList.remove("success", "error");
    hideModal();
    await fetch('/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(data => { throw new Error(data.error || 'Failed to register event'); });
      }
      return response.json();
    })
    .then(data => {
      // Show success message
      eventStatus.innerText = "Event successfully registered!";
      eventStatus.classList.add("success");
      eventStatus.classList.remove("error");
      console.log(data.status);
      
    })
    .catch(error => {
      // Display an error message
      eventStatus.innerText = `Error: ${error.message}`;
      eventStatus.classList.add("error");
      eventStatus.classList.remove("success");
    })
    .finally(() => {
      // Remove the show class after a delay
      setTimeout(() => {
        eventStatus.classList.remove("show");
      }, 3000);
      // hideModal();
      // Reload the month
      loadMonth();
    });
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


 async function showUserEvents() {
  const response = await fetch('/fevents', { method: 'GET' });
  const events = await response.json();
  const userEventsList = document.getElementById("userEventsList");

  userEventsList.innerHTML = '';

  if (events.length === 0) {
    userEventsList.innerHTML = '<p class="event-msg">No events found.</p>';
  } else {
    userEventsList.innerHTML = '<p class="event-msg">Your events: </p>';
    events.forEach(event => {
      const eventElement = document.createElement("div");
      eventElement.classList.add("event-item");

      const eventDesc = document.createElement("div");
      eventDesc.classList.add("event-desc");

      const eventSchoolName = document.createElement("p");
      eventSchoolName.innerText = `School Name: ${event.schoolName}`;

      const eventDistrict = document.createElement("p");
      eventDistrict.innerText = `District: ${event.district}`;

      const eventMobileNumber = document.createElement("p");
      eventMobileNumber.innerText = `Mobile Number: ${event.mobileNumber}`;

      const eventEmail = document.createElement("p");
      eventEmail.innerText = `Email: ${event.email}`;

      const eventDate = document.createElement("p");
      eventDate.innerText = `Date: ${event.day}-${months[event.month - 1]}-${event.year}`;

      eventDesc.appendChild(eventSchoolName);
      eventDesc.appendChild(eventDistrict);
      eventDesc.appendChild(eventMobileNumber);
      eventDesc.appendChild(eventEmail);
      eventDesc.appendChild(eventDate);
      eventElement.appendChild(eventDesc);

      userEventsList.appendChild(eventElement);
    });

  }
  userEventsList.style.display = "flex";
  setTimeout(() => {
    userEventsList.style.opacity = 1;
    
  }, 1000);
}

function hideUserEvents()
{
  const userEventsList = document.getElementById("userEventsList");
  userEventsList.style.opacity = 0;
  setTimeout(() => {
    
    userEventsList.style.display = "none";
  }, 1000);

}
let te = false;
function toggleUserEvents()
{
if(!te)
{
  te = true;
  showUserEvents();
}
else{
  te = false;
  hideUserEvents();
}
}