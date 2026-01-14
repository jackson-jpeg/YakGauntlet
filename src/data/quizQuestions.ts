export interface QuizQuestion {
  question: string;
  options: string[];
  correct: string[];
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question: "Select the 4 Ninja Turtles",
    options: ["Leonardo", "Donatello", "Raphael", "Michelangelo", "Splinter", "Shredder", "April", "Casey", "Krang", "Bebop", "Rocksteady", "Karai"],
    correct: ["Leonardo", "Donatello", "Raphael", "Michelangelo"]
  },
  {
    question: "Select the 5 Original Avengers",
    options: ["Iron Man", "Thor", "Hulk", "Captain America", "Black Widow", "Hawkeye", "Spider-Man", "Black Panther", "Doctor Strange", "Ant-Man", "Scarlet Witch", "Vision"],
    correct: ["Iron Man", "Thor", "Hulk", "Captain America", "Black Widow"]
  },
  {
    question: "Select the 4 Beatles Members",
    options: ["John Lennon", "Paul McCartney", "George Harrison", "Ringo Starr", "Pete Best", "Brian Epstein", "George Martin", "Mick Jagger", "Keith Richards", "Eric Clapton", "Bob Dylan", "David Bowie"],
    correct: ["John Lennon", "Paul McCartney", "George Harrison", "Ringo Starr"]
  },
  {
    question: "Select the 6 Original Friends Characters",
    options: ["Rachel", "Monica", "Phoebe", "Ross", "Chandler", "Joey", "Gunther", "Janice", "Emily", "Mike", "Richard", "Carol"],
    correct: ["Rachel", "Monica", "Phoebe", "Ross", "Chandler", "Joey"]
  },
  {
    question: "Select the 4 Ghostbusters (Original Movie)",
    options: ["Peter Venkman", "Ray Stantz", "Egon Spengler", "Winston Zeddemore", "Dana Barrett", "Louis Tully", "Janine Melnitz", "Walter Peck", "Slimer", "Stay Puft", "Gozer", "Zuul"],
    correct: ["Peter Venkman", "Ray Stantz", "Egon Spengler", "Winston Zeddemore"]
  },
  {
    question: "Select the 5 Great Lakes",
    options: ["Superior", "Michigan", "Huron", "Erie", "Ontario", "Champlain", "Okeechobee", "Tahoe", "Powell", "Crater", "Seneca", "Winnipeg"],
    correct: ["Superior", "Michigan", "Huron", "Erie", "Ontario"]
  },
  {
    question: "Select the 4 Houses of Hogwarts",
    options: ["Gryffindor", "Slytherin", "Hufflepuff", "Ravenclaw", "Durmstrang", "Beauxbatons", "Ilvermorny", "Castelobruxo", "Mahoutokoro", "Uagadou", "Koldovstoretz", "Nurmengard"],
    correct: ["Gryffindor", "Slytherin", "Hufflepuff", "Ravenclaw"]
  },
  {
    question: "Select the 4 Teenage Mutant Ninja Turtles' Weapons",
    options: ["Katana", "Bo Staff", "Sai", "Nunchucks", "Sword", "Spear", "Axe", "Mace", "Hammer", "Crossbow", "Shuriken", "Chain"],
    correct: ["Katana", "Bo Staff", "Sai", "Nunchucks"]
  },
  {
    question: "Select the 5 Barstool Personalities on The Yak",
    options: ["Big Cat", "KB", "Nick", "Rone", "Brandon Walker", "Dave Portnoy", "KFC", "Feitelberg", "PFT", "Hank", "Ria", "Kayce"],
    correct: ["Big Cat", "KB", "Nick", "Rone", "Brandon Walker"]
  },
  {
    question: "Select the 4 Suits in a Deck of Cards",
    options: ["Hearts", "Diamonds", "Clubs", "Spades", "Joker", "Ace", "King", "Queen", "Jack", "Trump", "Wild", "Tarot"],
    correct: ["Hearts", "Diamonds", "Clubs", "Spades"]
  }
];

export function getRandomQuestion(): QuizQuestion {
  return QUIZ_QUESTIONS[Math.floor(Math.random() * QUIZ_QUESTIONS.length)];
}
