export interface QuizQuestion {
  question: string;
  options: string[];
  correct: string[];
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  // --- YAK LORE & BARSTOOL ---
  {
    question: "Select the 5 Core Yak Members",
    options: ["Big Cat", "KB", "Nick", "Brandon Walker", "Titus", "Dave", "KFC", "Feits", "Hank", "PFT", "Ria", "Frank"],
    correct: ["Big Cat", "KB", "Nick", "Brandon Walker", "Titus"]
  },
  {
    question: "Select the 4 Things That Make You 'WET'",
    options: ["Slow Time", "Wheel Spin", "Bad Vibez", "Cheating", "Fast Time", "Winning", "Dry Run", "Clean Play", "Umbrella", "Perfect Score", "Clutch Play", "Lucky Break"],
    correct: ["Slow Time", "Wheel Spin", "Bad Vibez", "Cheating"]
  },
  {
    question: "Select 4 Nick Turani Nicknames",
    options: ["Nicky Clicky", "Nicky Smokes", "Clicky", "Mr. Bear", "Big Man", "Tank", "Mintzy", "Cheah", "BWalk", "Cat", "Young Mantis", "Nicky Sticks"],
    correct: ["Nicky Clicky", "Nicky Smokes", "Clicky", "Mr. Bear"]
  },
  {
    question: "Select 5 Recurring Yak Bits/Games",
    options: ["The Gauntlet", "Case Race", "Data Day", "Drafts", "Vibes", "Spelling Bee", "Hot Seat", "Blind Taste", "Trivia", "Jeopardy", "Wheel Game", "Challenge Day"],
    correct: ["The Gauntlet", "Case Race", "Data Day", "Drafts", "Vibes"]
  },
  {
    question: "Select 4 KB 'Bits'",
    options: ["Geography", "Wrestling", "Kratom", "Put it on the Prince", "Football", "Baseball", "Basketball", "Hockey", "Golf", "Tennis", "Soccer", "Rugby"],
    correct: ["Geography", "Wrestling", "Kratom", "Put it on the Prince"]
  },
  {
    question: "Select 3 Frank The Tank Passions",
    options: ["Mets", "Dolphins", "Soda", "Exercise", "Vegetables", "Quiet Time", "Yoga", "Pilates", "Hiking", "Camping", "Diet Food", "Meditation"],
    correct: ["Mets", "Dolphins", "Soda"]
  },

  // --- SPORTS TRIVIA ---
  {
    question: "Select the 4 Grand Slam Tennis Tournaments",
    options: ["Wimbledon", "US Open", "French Open", "Australian Open", "Italian Open", "Miami Open", "Indian Wells", "Davis Cup", "ATP Finals", "Monte Carlo", "Cincinnati", "Madrid"],
    correct: ["Wimbledon", "US Open", "French Open", "Australian Open"]
  },
  {
    question: "Select the 4 NFC East Teams",
    options: ["Cowboys", "Eagles", "Giants", "Commanders", "Patriots", "Jets", "Bills", "Dolphins", "Bears", "Lions", "Packers", "Vikings"],
    correct: ["Cowboys", "Eagles", "Giants", "Commanders"]
  },
  {
    question: "Select the 4 Major Golf Majors",
    options: ["The Masters", "US Open", "The Open", "PGA Championship", "Ryder Cup", "Presidents Cup", "FedEx Cup", "Players Championship", "Arnold Palmer", "Memorial", "BMW Championship", "Match Play"],
    correct: ["The Masters", "US Open", "The Open", "PGA Championship"]
  },
  {
    question: "Select the 5 Positions in Basketball",
    options: ["Point Guard", "Shooting Guard", "Small Forward", "Power Forward", "Center", "Quarterback", "Running Back", "Wide Receiver", "Tight End", "Linebacker", "Pitcher", "Catcher"],
    correct: ["Point Guard", "Shooting Guard", "Small Forward", "Power Forward", "Center"]
  },
  {
    question: "Select 4 MLB Teams in New York",
    options: ["Yankees", "Mets", "Brooklyn Dodgers", "NY Giants", "Red Sox", "Phillies", "Nationals", "Orioles", "Blue Jays", "Rays", "Marlins", "Braves"],
    correct: ["Yankees", "Mets", "Brooklyn Dodgers", "NY Giants"]
  },
  {
    question: "Select 4 NBA Teams from California",
    options: ["Lakers", "Clippers", "Warriors", "Kings", "Suns", "Blazers", "Jazz", "Nuggets", "Thunder", "Rockets", "Spurs", "Mavs"],
    correct: ["Lakers", "Clippers", "Warriors", "Kings"]
  },

  // --- GEOGRAPHY ---
  {
    question: "Select the 5 Boroughs of New York City",
    options: ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island", "Long Island", "Yonkers", "Jersey City", "Hoboken", "Newark", "Harlem", "SoHo"],
    correct: ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"]
  },
  {
    question: "Select the 5 Oceans",
    options: ["Pacific", "Atlantic", "Indian", "Arctic", "Southern", "Baltic", "Mediterranean", "Caribbean", "Caspian", "Red Sea", "Black Sea", "North Sea"],
    correct: ["Pacific", "Atlantic", "Indian", "Arctic", "Southern"]
  },
  {
    question: "Select the 6 New England States",
    options: ["Maine", "New Hampshire", "Vermont", "Massachusetts", "Rhode Island", "Connecticut", "New York", "New Jersey", "Pennsylvania", "Delaware", "Maryland", "Virginia"],
    correct: ["Maine", "New Hampshire", "Vermont", "Massachusetts", "Rhode Island", "Connecticut"]
  },
  {
    question: "Select the 2 Countries Starting with 'Z'",
    options: ["Zambia", "Zimbabwe", "Zaire", "Zealand", "Zanzibar", "Zurich", "Zagreb", "Zulu", "Zaragoza", "Zulia", "Zhengzhou", "Zacatecas"],
    correct: ["Zambia", "Zimbabwe"]
  },
  {
    question: "Select 4 Continents Starting with 'A'",
    options: ["Asia", "Africa", "Antarctica", "Australia", "Americas", "Atlantis", "Arctic", "Austria", "Argentina", "Albania", "Algeria", "Andorra"],
    correct: ["Asia", "Africa", "Antarctica", "Australia"]
  },
  {
    question: "Select 4 Countries in South America",
    options: ["Brazil", "Argentina", "Chile", "Peru", "Spain", "Mexico", "Cuba", "Panama", "Portugal", "Italy", "France", "Germany"],
    correct: ["Brazil", "Argentina", "Chile", "Peru"]
  },
  {
    question: "Select 4 US States Starting with 'M'",
    options: ["Maine", "Michigan", "Montana", "Missouri", "Mississippi", "Maryland", "Massachusetts", "Minnesota", "Miami", "Memphis", "Milwaukee", "Mesa"],
    correct: ["Maine", "Michigan", "Montana", "Missouri"]
  },
  {
    question: "Select 4 US States Starting with 'N'",
    options: ["New York", "New Jersey", "Nevada", "Nebraska", "North Carolina", "North Dakota", "New Hampshire", "New Mexico", "Norway", "Netherlands", "Nigeria", "Nepal"],
    correct: ["New York", "New Jersey", "Nevada", "Nebraska"]
  },

  // --- POP CULTURE ---
  {
    question: "Select the 4 Ninja Turtles",
    options: ["Leonardo", "Donatello", "Raphael", "Michelangelo", "Splinter", "Shredder", "April", "Casey", "Krang", "Bebop", "Rocksteady", "Karai"],
    correct: ["Leonardo", "Donatello", "Raphael", "Michelangelo"]
  },
  {
    question: "Select the 6 Friends Characters",
    options: ["Rachel", "Monica", "Phoebe", "Ross", "Chandler", "Joey", "Gunther", "Janice", "Emily", "Mike", "Richard", "Carol"],
    correct: ["Rachel", "Monica", "Phoebe", "Ross", "Chandler", "Joey"]
  },
  {
    question: "Select the 4 Hogwarts Houses",
    options: ["Gryffindor", "Slytherin", "Hufflepuff", "Ravenclaw", "Durmstrang", "Beauxbatons", "Ilvermorny", "Azkaban", "Diagon Alley", "Hogsmeade", "Ministry", "Forbidden"],
    correct: ["Gryffindor", "Slytherin", "Hufflepuff", "Ravenclaw"]
  },
  {
    question: "Select the 4 Teletubbies",
    options: ["Tinky Winky", "Dipsy", "Laa-Laa", "Po", "Noo-Noo", "Sun Baby", "Big Hugs", "Custard", "Tubby Toast", "Magic Tree", "Rabbits", "Voice Trumpet"],
    correct: ["Tinky Winky", "Dipsy", "Laa-Laa", "Po"]
  },
  {
    question: "Select the 5 Spice Girls",
    options: ["Scary", "Sporty", "Baby", "Ginger", "Posh", "Sassy", "Happy", "Peppy", "Fancy", "Glamour", "Sparkle", "Wild"],
    correct: ["Scary", "Sporty", "Baby", "Ginger", "Posh"]
  },
  {
    question: "Select the 3 Lord of the Rings Movies",
    options: ["Fellowship of the Ring", "Two Towers", "Return of the King", "The Hobbit", "Silmarillion", "Desolation of Smaug", "Five Armies", "Unexpected Journey", "Rings of Power", "Shadow of Mordor", "War of the Ring", "Battle for Middle Earth"],
    correct: ["Fellowship of the Ring", "Two Towers", "Return of the King"]
  },
  {
    question: "Select the 4 Suits in a Deck of Cards",
    options: ["Hearts", "Diamonds", "Clubs", "Spades", "Joker", "Ace", "King", "Queen", "Jack", "Trump", "Wild", "Stars"],
    correct: ["Hearts", "Diamonds", "Clubs", "Spades"]
  },
  {
    question: "Select the 7 Dwarfs from Snow White",
    options: ["Doc", "Grumpy", "Happy", "Sleepy", "Bashful", "Sneezy", "Dopey", "Hungry", "Thirsty", "Loud", "Quiet", "Tall"],
    correct: ["Doc", "Grumpy", "Happy", "Sleepy", "Bashful", "Sneezy", "Dopey"]
  },
  {
    question: "Select 4 Marvel Avengers (Original)",
    options: ["Iron Man", "Captain America", "Thor", "Hulk", "Spider-Man", "Wolverine", "Deadpool", "Venom", "Thanos", "Loki", "Ultron", "Groot"],
    correct: ["Iron Man", "Captain America", "Thor", "Hulk"]
  },
  {
    question: "Select 4 Star Wars Original Trilogy Characters",
    options: ["Luke", "Leia", "Han Solo", "Chewbacca", "Anakin", "Padme", "Qui-Gon", "Mace Windu", "Rey", "Finn", "Kylo Ren", "Grogu"],
    correct: ["Luke", "Leia", "Han Solo", "Chewbacca"]
  },

  // --- SCIENCE & GENERAL KNOWLEDGE ---
  {
    question: "Select the 4 States of Matter",
    options: ["Solid", "Liquid", "Gas", "Plasma", "Hard", "Soft", "Wet", "Dry", "Hot", "Cold", "Dense", "Light"],
    correct: ["Solid", "Liquid", "Gas", "Plasma"]
  },
  {
    question: "Select the 5 Senses",
    options: ["Sight", "Sound", "Smell", "Taste", "Touch", "Intuition", "Balance", "Pain", "Temperature", "Pressure", "Time", "Direction"],
    correct: ["Sight", "Sound", "Smell", "Taste", "Touch"]
  },
  {
    question: "Select the 3 Primary Colors",
    options: ["Red", "Blue", "Yellow", "Green", "Orange", "Purple", "Black", "White", "Grey", "Brown", "Pink", "Cyan"],
    correct: ["Red", "Blue", "Yellow"]
  },
  {
    question: "Select the 4 DNA Bases",
    options: ["Adenine", "Thymine", "Cytosine", "Guanine", "Uracil", "Protein", "Ribose", "Phosphate", "Helix", "Gene", "Codon", "Amino"],
    correct: ["Adenine", "Thymine", "Cytosine", "Guanine"]
  },
  {
    question: "Select the 2 Planets Closer to the Sun than Earth",
    options: ["Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto", "Moon", "Sun", "Ceres", "Eris"],
    correct: ["Mercury", "Venus"]
  },

  // --- FOOD & DRINK ---
  {
    question: "Select 5 Classic Pizza Toppings",
    options: ["Pepperoni", "Sausage", "Mushrooms", "Onions", "Peppers", "Chocolate", "Ice Cream", "Candy", "Cereal", "Popcorn", "Cookies", "Cake"],
    correct: ["Pepperoni", "Sausage", "Mushrooms", "Onions", "Peppers"]
  },
  {
    question: "Select 4 Soda Brands",
    options: ["Coca-Cola", "Pepsi", "Sprite", "Dr Pepper", "Milk", "Water", "Orange Juice", "Coffee", "Tea", "Beer", "Wine", "Lemonade"],
    correct: ["Coca-Cola", "Pepsi", "Sprite", "Dr Pepper"]
  },
  {
    question: "Select 4 Fast Food Chains",
    options: ["McDonalds", "Burger King", "Wendys", "Taco Bell", "Walmart", "Target", "Costco", "Amazon", "Walgreens", "CVS", "Home Depot", "Lowes"],
    correct: ["McDonalds", "Burger King", "Wendys", "Taco Bell"]
  },
  {
    question: "Select 4 Types of Pasta",
    options: ["Spaghetti", "Penne", "Rigatoni", "Fettuccine", "Bread", "Rice", "Quinoa", "Couscous", "Barley", "Oats", "Wheat", "Corn"],
    correct: ["Spaghetti", "Penne", "Rigatoni", "Fettuccine"]
  }
];

// Fix any questions that don't have exactly 12 options
QUIZ_QUESTIONS.forEach(q => {
  if (q.options.length < 12) {
    console.warn(`Question "${q.question}" has only ${q.options.length} options`);
  }
  // Ensure correct answers are subset of options
  q.correct.forEach(c => {
    if (!q.options.includes(c)) {
      console.warn(`Correct answer "${c}" not in options for "${q.question}"`);
    }
  });
});

export function getRandomQuestion(): QuizQuestion {
  return QUIZ_QUESTIONS[Math.floor(Math.random() * QUIZ_QUESTIONS.length)];
}
