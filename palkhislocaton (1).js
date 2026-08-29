const express = require("express");
const app = express();
const port = 3000;

// 1. Master lookup for Ashadhi Ekadashi dates (Anchor dates)
const ASHADHI_EKADASHI_DATES = {
  2020: "2020-07-01",
  2021: "2021-07-20",
  2022: "2022-07-10",
  2023: "2023-06-29",
  2024: "2024-07-17",
  2025: "2025-07-06",
  2026: "2026-06-25",
  2027: "2027-07-14",
  2028: "2028-07-03",
  2029: "2029-07-21",
  2030: "2030-07-10",
};

// 2. Complete Metadata for all 7 Palkhis
const PALKHI_CONFIG = {
  dnyaneshwar: {
    name: "Sant Dnyaneshwar Maharaj Palkhi",
    startPoint: "Alandi",
     daysBeforeEkadashi: 18,
    halts: [
      { day: 1, name: "Alandi", lat: 18.6756, lng: 73.8967 },
      { day: 2, name: "Pune (Bhavani Peth)", lat: 18.5074, lng: 73.8677 },
      { day: 3, name: "Pune (Bhavani Peth)", lat: 18.5074, lng: 73.8677 },
      { day: 4, name: "Saswad", lat: 18.3439, lng: 74.0305 },
      { day: 5, name: "Saswad", lat: 18.3439, lng: 74.0305 },
      { day: 6, name: "Jejuri", lat: 18.2755, lng: 74.1601 },
      { day: 7, name: "Valhe", lat: 18.1748, lng: 74.1565 },
      { day: 8, name: "Lonand", lat: 17.9546, lng: 74.1866 },
      { day: 9, name: "Lonand", lat: 17.9546, lng: 74.1866 },
      { day: 10, name: "Taradgaon", lat: 17.9625, lng: 74.2756 },
      { day: 11, name: "Phaltan", lat: 17.9866, lng: 74.4338 },
      { day: 12, name: "Barad", lat: 17.9157, lng: 74.6147 },
      { day: 13, name: "Natepute", lat: 17.9042, lng: 74.7708 },
      { day: 14, name: "Malshiras", lat: 17.8427, lng: 74.9208 },
      { day: 15, name: "Velapur", lat: 17.7562, lng: 75.0506 },
      { day: 16, name: "Bhandishegaon", lat: 17.7126, lng: 75.1843 },
      { day: 17, name: "Wakhari", lat: 17.6974, lng: 75.2759 },
      { day: 18, name: "Pandharpur", lat: 17.6775, lng: 75.3278 },
    ],
  },
  tukaram: {
    name: "Sant Tukaram Maharaj Palkhi",
    startPoint: "Dehu",
    daysBeforeEkadashi: 19,
    halts: [
      { day: 1, name: "Dehu", lat: 18.7188, lng: 73.7699 },
      { day: 2, name: "Akurdi", lat: 18.6496, lng: 73.7707 },
      { day: 3, name: "Pune (Nana Peth)", lat: 18.5158, lng: 73.8638 },
      { day: 4, name: "Pune (Nana Peth)", lat: 18.5158, lng: 73.8638 },
      { day: 5, name: "Loni Kalbhor", lat: 18.4892, lng: 74.0208 },
      { day: 6, name: "Yavat", lat: 18.4682, lng: 74.2882 },
      { day: 7, name: "Varvand", lat: 18.3976, lng: 74.4079 },
      { day: 8, name: "Undwadi Gavalyachi", lat: 18.2892, lng: 74.5012 },
      { day: 9, name: "Baramati", lat: 18.1517, lng: 74.5772 },
      { day: 10, name: "Sansar", lat: 18.0694, lng: 74.7567 },
      { day: 11, name: "Anthurne", lat: 18.0435, lng: 74.8845 },
      { day: 12, name: "Nimgaon Ketki", lat: 18.0573, lng: 74.9654 },
      { day: 13, name: "Indapur", lat: 18.1158, lng: 75.0345 },
      { day: 14, name: "Sarati", lat: 17.9942, lng: 75.0682 },
      { day: 15, name: "Akluj", lat: 17.8864, lng: 75.0217 },
      { day: 16, name: "Borgaon", lat: 17.7845, lng: 75.1412 },
      { day: 17, name: "Pirachi Kuroli", lat: 17.7289, lng: 75.2215 },
      { day: 18, name: "Wakhari", lat: 17.6974, lng: 75.2759 },
      { day: 19, name: "Pandharpur", lat: 17.6775, lng: 75.3278 },
    ],
  },
  muktabai: {
    name: "Sant Muktabai Palkhi",
    startPoint: "Muktainagar (Kothali)",
    daysBeforeEkadashi: 33, 
    halts: [
      { day: 1, name: "Muktainagar (Kothali)", lat: 21.0536, lng: 76.0463 },
      { day: 2, name: "Bhusawal", lat: 21.0455, lng: 75.8011 },
      { day: 4, name: "Jalgaon", lat: 21.0077, lng: 75.5626 },
      { day: 7, name: "Pachora", lat: 20.6698, lng: 75.3524 },
      { day: 10, name: "Chalisgaon", lat: 20.4619, lng: 74.9984 },
      { day: 13, name: "Nandgaon", lat: 20.3106, lng: 74.6586 },
      { day: 15, name: "Yeola", lat: 20.0384, lng: 74.4883 },
      { day: 17, name: "Kopargaon", lat: 19.8872, lng: 74.4756 },
      { day: 20, name: "Rahuri", lat: 19.3900, lng: 74.6517 },
      { day: 22, name: "Ahmednagar", lat: 19.0952, lng: 74.7496 },
      { day: 26, name: "Karmala", lat: 18.4060, lng: 75.2014 },
      { day: 29, name: "Kurduwadi", lat: 18.0833, lng: 75.4313 },
      { day: 31, name: "Bhandishegaon", lat: 17.7126, lng: 75.1843 },
      { day: 32, name: "Wakhari", lat: 17.6974, lng: 75.2759 },
      { day: 33, name: "Pandharpur", lat: 17.6775, lng: 75.3278 }
    ],
  },
  rukhmini: {
    name: "Rukhmini Devi Palkhi",
    startPoint: "Kaundanyapur",
    daysBeforeEkadashi: 30,
    halts: [
      { day: 1, name: "Kaundanyapur", lat: 20.9150, lng: 78.1065 },
      { day: 2, name: "Kurha", lat: 20.8403, lng: 78.0264 },
      { day: 4, name: "Pulgaon", lat: 20.7302, lng: 78.3243 },
      { day: 6, name: "Wardha", lat: 20.7453, lng: 78.6022 },
      { day: 10, name: "Yavatmal", lat: 20.3888, lng: 78.1204 },
      { day: 14, name: "Umarkhed", lat: 19.5960, lng: 77.6974 },
      { day: 17, name: "Hingoli", lat: 19.7155, lng: 77.1471 },
      { day: 20, name: "Parbhani", lat: 19.2644, lng: 76.7725 },
      { day: 23, name: "Majalgaon", lat: 19.1554, lng: 76.2230 },
      { day: 25, name: "Beed", lat: 18.9901, lng: 75.7531 },
      { day: 27, name: "Kalamb", lat: 18.0436, lng: 75.9220 },
      { day: 28, name: "Kurduwadi", lat: 18.0833, lng: 75.4313 },
      { day: 29, name: "Wakhari", lat: 17.6974, lng: 75.2759 },
      { day: 30, name: "Pandharpur", lat: 17.6775, lng: 75.3278 }
    ],
  },
  gajanan: {
    name: "Sant Gajanan Maharaj Palkhi",
    startPoint: "Shegaon",
    daysBeforeEkadashi: 33,
    halts: [
      { day: 1, name: "Shegaon", lat: 20.7937, lng: 76.6946 },
      { day: 4, name: "Akola", lat: 20.7059, lng: 77.0019 },
      { day: 10, name: "Risod", lat: 19.9749, lng: 76.7766 },
      { day: 15, name: "Parbhani", lat: 19.2644, lng: 76.7725 },
      { day: 19, name: "Parali Vaijaynath", lat: 18.8475, lng: 76.3197 },
      { day: 26, name: "Tuljapur", lat: 18.0131, lng: 76.0747 },
      { day: 29, name: "Solapur", lat: 17.6599, lng: 75.9064 },
      { day: 33, name: "Pandharpur", lat: 17.6775, lng: 75.3278 }
    ],
  },
  nivrutti: {
    name: "Sant Nivruttinath Maharaj Palkhi",
    startPoint: "Trimbakeshwar",
    daysBeforeEkadashi: 27,
    halts: [
      { day: 1, name: "Trimbakeshwar", lat: 19.9328, lng: 73.5312 },
      { day: 3, name: "Nashik (Panchavati)", lat: 20.0110, lng: 73.7902 },
      { day: 8, name: "Sinnar", lat: 19.8459, lng: 74.0013 },
      { day: 12, name: "Sangamner", lat: 19.5761, lng: 74.2057 },
      { day: 15, name: "Ahmednagar", lat: 19.0952, lng: 74.7496 },
      { day: 24, name: "Karmala", lat: 18.4060, lng: 75.2014 },
      { day: 26, name: "Wakhari", lat: 17.6974, lng: 75.2759 },
      { day: 27, name: "Pandharpur", lat: 17.6775, lng: 75.3278 }
    ],
  },
  sopan: {
    name: "Sant Sopankaka Palkhi",
    startPoint: "Saswad",
    daysBeforeEkadashi: 18, 
    halts: [
      { day: 1, name: "Saswad", lat: 18.3439, lng: 74.0305 },
      { day: 3, name: "Nira", lat: 18.1130, lng: 74.2155 },
      { day: 7, name: "Baramati", lat: 18.1517, lng: 74.5772 },
      { day: 10, name: "Akluj", lat: 17.8864, lng: 75.0217 },
      { day: 13, name: "Velapur", lat: 17.7562, lng: 75.0506 },
      { day: 17, name: "Wakhari", lat: 17.6974, lng: 75.2759 },
      { day: 18, name: "Pandharpur", lat: 17.6775, lng: 75.3278 }
    ]
  }
};

// 3. Calculation function to map dates dynamically
function getPalkhiScheduleForYear(palkhiKey, year) {
  const ekadashiStr = ASHADHI_EKADASHI_DATES[year];
  if (!ekadashiStr) {
    throw new Error(`Ashadhi Ekadashi date not configured for year ${year}`);
  }

  const palkhi = PALKHI_CONFIG[palkhiKey];
  if (!palkhi) {
    throw new Error(`Invalid Palkhi key: ${palkhiKey}`);
  }

  // Calculate Day 1 departure date backwards from Ashadhi Ekadashi
  const ekadashiDate = new Date(ekadashiStr);
  const day1Date = new Date(ekadashiDate);
  day1Date.setDate(day1Date.getDate() - (palkhi.daysBeforeEkadashi - 1));

  // Build the schedule array with correct Gregorian dates attached
  const schedule = palkhi.halts.map((halt) => {
    const haltDate = new Date(day1Date);
    // (halt.day - 1) because Day 1 is index 0 shift
    haltDate.setDate(haltDate.getDate() + (halt.day - 1));

    return {
      dayNumber: halt.day,
      locationName: halt.name,
      lat: halt.lat,
      lng: halt.lng,
      date: haltDate.toISOString().split("T")[0], // YYYY-MM-DD
    };
  });

  return {
    year: year,
    palkhiName: palkhi.name,
    ashadhiEkadashiDate: ekadashiStr,
    day1Date: day1Date.toISOString().split("T")[0],
    schedule: schedule,
  };
}

// 4. API Endpoint (GET Request Handler)
// Example Usage: GET http://localhost:3000/api/palkhi/dnyaneshwar?year=2024
app.get('/api/palkhi/:name', (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const palkhiKey = req.params.name.toLowerCase();
    
    const data = getPalkhiScheduleForYear(palkhiKey, year);
    res.status(200).json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 5. Start the server
app.listen(port, () => {
  console.log(`Wari Tracking API running at http://localhost:${port}`);
  console.log(`Test URL: http://localhost:${port}/api/palkhi/tukaram?year=2024`);
});