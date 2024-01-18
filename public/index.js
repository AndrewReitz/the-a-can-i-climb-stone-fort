const now = new Date();
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast?' + 
'latitude=35.25044897619545&longitude=-85.2174239811042&' +
'hourly=precipitation&daily=precipitation_sum&' + 
'temperature_unit=fahrenheit&windspeed_unit=mph&precipitation_unit=inch&timezone=America%2FChicago&past_days=6&forecast_days=1';

const loadWeatherData = async () => {
  try {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "text/json");

    const response = await fetch(WEATHER_URL);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    return { data: data, error: null };
  } catch (error) {
    console.error(error);
    return { data: null, error: error };
  }
};

const formatDate = (inputDate) => {
  // Parse the input date string into a Date object
  const date = new Date(inputDate);

  // Define an array of month names
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ];

  // Get the month and day
  const month = monthNames[date.getMonth()];
  const day = date.getDate();

  return `${month} ${day}`;
};

const calculateTimeAgo = (targetDate) => {
  const targetDateTime = new Date(targetDate);

  // Calculate the time difference in milliseconds
  const timeDifference = now - targetDateTime;

  // Calculate the number of days and hours
  const daysAgo = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
  const hoursAgo = Math.floor(
    (timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );

  return `${daysAgo} days and ${hoursAgo} hours ago`;
};

const hoursSince = (dateTime) => {
  const timeDiff = now - dateTime;
  return timeDiff / (1000 * 60 * 60);
};

const main = async () => {
  const weatherDataWrapped = await loadWeatherData();

  console.log(weatherDataWrapped);

  if (weatherDataWrapped.error !== null) {
    document.getElementById("data").innerText =
      "There was an error loading data. Please try refreshing the page";
    return;
  }

  const weatherData = weatherDataWrapped.data;

  const hourlyTime = weatherData.hourly.time;

  const hourlyPrecip = weatherData.hourly.precipitation;
  const lastRained = [...hourlyTime.keys()]
    .reverse()
    .map((i) => {
      return {
        dateTime: new Date(hourlyTime[i]),
        precip: hourlyPrecip[i]
      };
    })
    .find((d) => d.precip > 0 && d.dateTime <= now);



  const dataElement = document.getElementById("data");

  if (lastRained) {
    const hoursSinceLastRain = hoursSince(lastRained.dateTime);

    let message;
    if (hoursSinceLastRain < 48) {
      message = `<h2 class="red">No.</h2>`;
    } else {
      message = `<h2 class="green">Probably*</h2>`;
    }

    dataElement.innerHTML = `${message}<h4 class="center">
    It last rained ${calculateTimeAgo(lastRained.dateTime)}</h4>`;
  } else {
    dataElement = `<h2 class="green">Probably*</h2><h4 class="center">
    It last rained over a week ago.</h4>`;
  }
  dataElement.classList.remove("skeleton");
  dataElement.classList.remove("skeleton-text");

  const dailyTime = weatherData.daily.time;
  const dailyPrecip = weatherData.daily.precipitation_sum;

  const graphData = [...dailyTime.keys()].map((i) => {
    return { x: formatDate(dailyTime[i]), y: dailyPrecip[i] };
  });

  const ctx = document.getElementById("myChart").getContext("2d");

  const data = {
    datasets: [
      {
        label: "Total Precipitation in Inches",
        data: graphData
      }
    ]
  };

  new Chart(ctx, {
    type: "bar",
    data: data
  });
};

main();
