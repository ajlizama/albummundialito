// Dataset oficial Panini FIFA World Cup 2026 — 980 láminas
//
// Estructura por equipo (20 láminas):
//   1       = Team Logo (foil)
//   2 - 12  = jugadores
//   13      = Team Photo
//   14 - 20 = jugadores
//
// Estructura FWC especial (20 láminas):
//   "00"   = Panini Logo (foil)
//   FWC1-8 = Intro: emblemas, mascotas, lema, balón, países sede (todos foil)
//   FWC9-19 = Historia del Mundial (foil)

export type StickerKind = "emblem" | "player" | "team_photo" | "special";

export interface Sticker {
  id: string;
  code: string;
  number: number;
  numberLabel?: string;
  kind: StickerKind;
  name?: string;
  foil?: boolean;
  category?: "intro" | "host" | "history";
}

export interface Team {
  code: string;
  name: string;
  nameEs: string;
  group: string;
  federation: string;
  flag: string; // ISO 3166-1 alpha-2 (lowercase). GB subdivisions: gb-eng, gb-sct.
  primary: string;
  secondary: string;
  accent: string;
  stickers: Sticker[];
}

// URL de la bandera vectorial vía flagcdn.com (gratis, sin auth)
export function flagUrl(team: Team | string, size: "sm" | "md" | "lg" = "md"): string {
  const code = typeof team === "string" ? team : team.flag;
  // sm/md/lg → ancho en pixeles para la version raster (svg para md+ ideal)
  if (size === "sm") return `https://flagcdn.com/w40/${code}.png`;
  if (size === "lg") return `https://flagcdn.com/w320/${code}.png`;
  return `https://flagcdn.com/w160/${code}.png`;
}

export function flagSvgUrl(team: Team | string): string {
  const code = typeof team === "string" ? team : team.flag;
  return `https://flagcdn.com/${code}.svg`;
}

// Construye 20 stickers de un equipo a partir de los 18 nombres de jugadores
// (en orden: slots 2-12, luego 14-20)
const team = (
  code: string,
  name: string,
  nameEs: string,
  group: string,
  federation: string,
  flag: string,
  colors: { primary: string; secondary: string; accent: string },
  players: string[]
): Team => {
  if (players.length !== 18) {
    console.warn(`${code}: expected 18 players, got ${players.length}`);
  }
  const stickers: Sticker[] = [
    { id: `${code}-1`, code, number: 1, kind: "emblem", foil: true },
    ...players.slice(0, 11).map((n, i) => ({
      id: `${code}-${i + 2}`,
      code,
      number: i + 2,
      kind: "player" as const,
      name: n,
    })),
    { id: `${code}-13`, code, number: 13, kind: "team_photo" },
    ...players.slice(11, 18).map((n, i) => ({
      id: `${code}-${i + 14}`,
      code,
      number: i + 14,
      kind: "player" as const,
      name: n,
    })),
  ];
  return { code, name, nameEs, group, federation, flag, ...colors, stickers };
};

export const TEAMS: Team[] = [
  // ============ GRUPO A ============
  team("MEX", "Mexico", "México", "A",
    "Federación Mexicana de Fútbol Asociación, A.C.",
    "mx",
    { primary: "#006341", secondary: "#ce1126", accent: "#ffffff" },
    [
      "Luis Malagón", "Johan Vásquez", "Jorge Sánchez", "César Montes",
      "Jesús Gallardo", "Israel Reyes", "Diego Lainez", "Carlos Rodríguez",
      "Edson Álvarez", "Orbelín Pineda", "Marcel Ruiz",
      "Erick Sánchez", "Hirving Lozano", "Santiago Giménez", "Raúl Jiménez",
      "Alexis Vega", "Roberto Alvarado", "César Huerta",
    ]),

  team("RSA", "South Africa", "Sudáfrica", "A",
    "South African Football Association",
    "za",
    { primary: "#007a4d", secondary: "#ffb612", accent: "#de3831" },
    [
      "Ronwen Williams", "Sipho Chaine", "Aubrey Modiba", "Samukele Kabini",
      "Mbekezeli Mbokazi", "Khulumani Ndamane", "Siyabonga Ngezana", "Khuliso Mudau",
      "Nkosinathi Sibisi", "Teboho Mokoena", "Thalente Mbatha",
      "Bathusi Aubaas", "Yaya Sithole", "Sipho Mbule", "Lyle Foster",
      "Iqraam Rayners", "Mohau Nkota", "Oswin Appollis",
    ]),

  team("KOR", "Korea Republic", "Corea del Sur", "A",
    "Korea Football Association",
    "kr",
    { primary: "#cd2e3a", secondary: "#0047a0", accent: "#ffffff" },
    [
      "Hyeon-woo Jo", "Seung-Gyu Kim", "Min-jae Kim", "Yu-min Cho",
      "Young-woo Seol", "Han-beom Lee", "Tae-seok Lee", "Myung-jae Lee",
      "Jae-sung Lee", "In-beom Hwang", "Kang-in Lee",
      "Seung-ho Paik", "Jens Castrop", "Dongg-yeong Lee", "Gue-sung Cho",
      "Heung-min Son", "Hee-chan Hwang", "Hyeon-Gyu Oh",
    ]),

  team("CZE", "Czechia", "Chequia", "A",
    "Fotbalová asociace České republiky",
    "cz",
    { primary: "#11457e", secondary: "#d7141a", accent: "#ffffff" },
    [
      "Matěj Kovář", "Jindřich Staněk", "Ladislav Krejčí", "Vladimír Coufal",
      "Jaroslav Zelený", "Tomáš Holeš", "David Zima", "Michal Sadílek",
      "Lukáš Provod", "Lukáš Červ", "Tomáš Souček",
      "Pavel Šulc", "Matěj Vydra", "Vasil Kušej", "Tomáš Chorý",
      "Václav Černý", "Adam Hložek", "Patrik Schick",
    ]),

  // ============ GRUPO B ============
  team("CAN", "Canada", "Canadá", "B",
    "Canadian Soccer Association",
    "ca",
    { primary: "#d52b1e", secondary: "#ffffff", accent: "#a01818" },
    [
      "Dayne St. Clair", "Alphonso Davies", "Alistair Johnston", "Samuel Adekugbe",
      "Richie Larvea", "Derek Cornelius", "Moïse Bombito", "Kamal Miller",
      "Stephen Eustáquio", "Ismaël Koné", "Jonathan Osorio",
      "Jacob Shaffelburg", "Mathieu Choinière", "Niko Sigur", "Tajon Buchanan",
      "Liam Millar", "Cyle Larin", "Jonathan David",
    ]),

  team("BIH", "Bosnia-Herzegovina", "Bosnia y Herzegovina", "B",
    "Nogometni/Fudbalski Savez Bosne i Hercegovine",
    "ba",
    { primary: "#002395", secondary: "#fecb00", accent: "#ffffff" },
    [
      "Nikola Vasilj", "Amer Dedić", "Sead Kolašinac", "Tarik Muharemović",
      "Nihad Mujakić", "Nikola Katić", "Amir Hadžiahmetović", "Benjamin Tahirović",
      "Armin Gigović", "Ivan Šunjić", "Ivan Bašić",
      "Dženis Burnić", "Esmir Bajraktarević", "Amar Memić", "Ermedin Demirović",
      "Edin Džeko", "Samed Baždar", "Haris Tabaković",
    ]),

  team("QAT", "Qatar", "Catar", "B",
    "Qatar Football Association",
    "qa",
    { primary: "#8a1538", secondary: "#ffffff", accent: "#5d0e26" },
    [
      "Meshaal Barsham", "Sultan Albrake", "Lucas Mendes", "Homam Ahmed",
      "Boualem Khoukhi", "Pedro Miguel", "Tarek Salman", "Mohamed Al-Mannai",
      "Karim Boudiaf", "Assim Madibo", "Ahmed Fatehi",
      "Mohammed Waad", "Abdulaziz Hatem", "Hassan Al-Haydos", "Edmilson Junior",
      "Akram Hassan Afif", "Ahmed Al-Ganehi", "Almoez Ali",
    ]),

  team("SUI", "Switzerland", "Suiza", "B",
    "Schweizerischer Fussballverband",
    "ch",
    { primary: "#dc0018", secondary: "#ffffff", accent: "#9b0014" },
    [
      "Gregor Kobel", "Yvon Mvogo", "Manuel Akanji", "Ricardo Rodríguez",
      "Nico Elvedi", "Aurèle Amenda", "Silvan Widmer", "Granit Xhaka",
      "Denis Zakaria", "Remo Freuler", "Fabian Rieder",
      "Ardon Jashari", "Johan Manzambi", "Michel Aebischer", "Breel Embolo",
      "Rubén Vargas", "Dan Ndoye", "Zeki Amdouni",
    ]),

  // ============ GRUPO C ============
  team("BRA", "Brazil", "Brasil", "C",
    "Confederação Brasileira de Futebol",
    "br",
    { primary: "#009c3b", secondary: "#ffdf00", accent: "#002776" },
    [
      "Alisson", "Bento", "Marquinhos", "Éder Militão",
      "Gabriel Magalhães", "Danilo", "Wesley", "Lucas Paquetá",
      "Casemiro", "Bruno Guimarães", "Luiz Henrique",
      "Vinícius Júnior", "Rodrygo", "João Pedro", "Matheus Cunha",
      "Gabriel Martinelli", "Raphinha", "Estêvão",
    ]),

  team("MAR", "Morocco", "Marruecos", "C",
    "Fédération royale marocaine de football",
    "ma",
    { primary: "#c1272d", secondary: "#006233", accent: "#8a181d" },
    [
      "Yassine Bounou", "Munir El Kajoui", "Achraf Hakimi", "Noussair Mazraoui",
      "Nayef Aguerd", "Romain Saïss", "Jawad El Yamiq", "Adam Masina",
      "Sofyan Amrabat", "Azzedine Ounahi", "Eliesse Ben Seghir",
      "Bilal El Khannouss", "Ismael Saibari", "Youssef En-Nesyri", "Abde Ezzalzouli",
      "Soufiane Rahimi", "Brahim Díaz", "Ayoub El Kaabi",
    ]),

  team("HAI", "Haiti", "Haití", "C",
    "Fédération Haïtienne de Football",
    "ht",
    { primary: "#00209f", secondary: "#d21034", accent: "#001870" },
    [
      "Johny Placide", "Carlens Arcus", "Martin Experience", "Jean-Kevin Duverne",
      "Ricardo Adé", "Duke Lacroix", "Garven Metusala", "Hannes Delcroix",
      "Leverton Pierre", "Danley Jean Jacques", "Jean-Ricner Bellegarde",
      "Christopher Attys", "Derrick Etienne Jr", "Josué Casimir", "Ruben Providence",
      "Duckens Nazon", "Louicius Deedson", "Frantzdy Pierrot",
    ]),

  team("SCO", "Scotland", "Escocia", "C",
    "Scottish National Team",
    "gb-sct",
    { primary: "#005eb8", secondary: "#ffffff", accent: "#00427d" },
    [
      "Angus Gunn", "Jack Hendry", "Kieran Tierney", "Aaron Hickey",
      "Andrew Robertson", "Scott McKenna", "John Souttar", "Anthony Ralston",
      "Grant Hanley", "Scott McTominay", "Billy Gilmour",
      "Lewis Ferguson", "Ryan Christie", "Kenny McLean", "John McGinn",
      "Lyndon Dykes", "Ché Adams", "Ben Gannon-Doak",
    ]),

  // ============ GRUPO D ============
  team("USA", "USA", "Estados Unidos", "D",
    "U.S. Soccer Federation",
    "us",
    { primary: "#b22234", secondary: "#3c3b6e", accent: "#ffffff" },
    [
      "Matt Freese", "Chris Richards", "Tim Ream", "Mark McKenzie",
      "Alex Freeman", "Antonee Robinson", "Tyler Adams", "Tanner Tessmann",
      "Weston McKennie", "Christian Roldan", "Timothy Weah",
      "Diego Luna", "Malik Tillman", "Christian Pulisic", "Brenden Aaronson",
      "Ricardo Pepi", "Haji Wright", "Folarin Balogun",
    ]),

  team("PAR", "Paraguay", "Paraguay", "D",
    "Asociación Paraguaya de Fútbol",
    "py",
    { primary: "#d52b1e", secondary: "#0038a8", accent: "#ffffff" },
    [
      "Roberto Fernández", "Orlando Gill", "Gustavo Gómez", "Fabián Balbuena",
      "Juan José Cáceres", "Omar Alderete", "Júnior Alonso", "Mathías Villasanti",
      "Diego Gómez", "Damián Bobadilla", "Andrés Cubas",
      "Matías Galarza Fonda", "Julio Enciso", "Alejandro Romero Gamarra", "Miguel Almirón",
      "Ramón Sosa", "Ángel Romero", "Antonio Sanabria",
    ]),

  team("AUS", "Australia", "Australia", "D",
    "Football Australia",
    "au",
    { primary: "#012169", secondary: "#e4002b", accent: "#ffffff" },
    [
      "Mathew Ryan", "Joe Gauci", "Harry Souttar", "Alessandro Circati",
      "Jordan Bos", "Aziz Behich", "Cameron Burgess", "Lewis Miller",
      "Miloš Degenek", "Jackson Irvine", "Riley McGree",
      "Aiden O'Neill", "Connor Metcalfe", "Patrick Yazbek", "Craig Goodwin",
      "Kusini Vengi", "Nestory Irankunda", "Mohamed Toure",
    ]),

  team("TUR", "Türkiye", "Turquía", "D",
    "Türkiye Futbol Federasyonu",
    "tr",
    { primary: "#e30a17", secondary: "#ffffff", accent: "#a00811" },
    [
      "Uğurcan Çakır", "Mert Müldür", "Zeki Çelik", "Abdülkerim Bardakcı",
      "Çağlar Söyüncü", "Merih Demiral", "Ferdi Kadıoğlu", "Kaan Ayhan",
      "İsmail Yüksek", "Hakan Çalhanoğlu", "Orkun Kökçü",
      "Arda Güler", "İrfan Can Kahveci", "Yunus Akgün", "Can Uzun",
      "Barış Alper Yılmaz", "Kerem Aktürkoğlu", "Kenan Yıldız",
    ]),

  // ============ GRUPO E ============
  team("GER", "Germany", "Alemania", "E",
    "Deutscher Fußball-Bund",
    "de",
    { primary: "#000000", secondary: "#dd0000", accent: "#ffce00" },
    [
      "Marc-André ter Stegen", "Jonathan Tah", "David Raum", "Nico Schlotterbeck",
      "Antonio Rüdiger", "Waldemar Anton", "Ridle Baku", "Maximilian Mittelstädt",
      "Joshua Kimmich", "Florian Wirtz", "Felix Nmecha",
      "Leon Goretzka", "Jamal Musiala", "Serge Gnabry", "Kai Havertz",
      "Leroy Sané", "Karim Adeyemi", "Nick Woltemade",
    ]),

  team("CUW", "Curaçao", "Curazao", "E",
    "Federashon Futbòl Kòrsou",
    "cw",
    { primary: "#002b7f", secondary: "#f9e814", accent: "#001b56" },
    [
      "Eloy Room", "Armando Obispo", "Sherel Floranus", "Jurien Gaari",
      "Joshua Brenet", "Roshon van Eijma", "Shurandy Sambo", "Livano Comenencia",
      "Godfried Roemeratoe", "Juninho Bacuna", "Leandro Bacuna",
      "Tahith Chong", "Kenji Gorré", "Jearl Margaritha", "Jürgen Locadia",
      "Jeremy Antonisse", "Gervane Kastaneer", "Sontje Hansen",
    ]),

  team("CIV", "Côte d'Ivoire", "Costa de Marfil", "E",
    "Fédération Ivoirienne de Football",
    "ci",
    { primary: "#f77f00", secondary: "#009e60", accent: "#ffffff" },
    [
      "Yahia Fofana", "Ghislain Konan", "Wilfried Singo", "Odilon Kossounou",
      "Evan Ndicka", "Willy Boly", "Emmanuel Agbadou", "Ousmane Diomandé",
      "Franck Kessié", "Seko Fofana", "Ibrahim Sangaré",
      "Jean-Philippe Gbamin", "Amad Diallo", "Sébastien Haller", "Simon Adingra",
      "Yan Diomandé", "Evann Guessand", "Oumar Diakité",
    ]),

  team("ECU", "Ecuador", "Ecuador", "E",
    "Federación Ecuatoriana de Fútbol",
    "ec",
    { primary: "#ffd100", secondary: "#034ea2", accent: "#ed1c24" },
    [
      "Hernán Galíndez", "Gonzalo Valle", "Piero Hincapié", "Pervis Estupiñán",
      "Willian Pacho", "Ángelo Preciado", "Joel Ordóñez", "Moisés Caicedo",
      "Alan Franco", "Kendry Páez", "Pedro Vite",
      "John Yeboah", "Leonardo Campana", "Gonzalo Plata", "Nilson Angulo",
      "Alan Minda", "Kevin Rodríguez", "Enner Valencia",
    ]),

  // ============ GRUPO F ============
  team("NED", "Netherlands", "Países Bajos", "F",
    "Koninklijke Nederlandse Voetbalbond",
    "nl",
    { primary: "#f36c21", secondary: "#21468b", accent: "#ae1c28" },
    [
      "Bart Verbruggen", "Virgil van Dijk", "Micky van de Ven", "Jurriën Timber",
      "Denzel Dumfries", "Nathan Aké", "Jeremie Frimpong", "Jan Paul van Hecke",
      "Tijjani Reijnders", "Ryan Gravenberch", "Teun Koopmeiners",
      "Frenkie de Jong", "Xavi Simons", "Justin Kluivert", "Memphis Depay",
      "Donyell Malen", "Wout Weghorst", "Cody Gakpo",
    ]),

  team("JPN", "Japan", "Japón", "F",
    "Japan Football Association",
    "jp",
    { primary: "#bc002d", secondary: "#ffffff", accent: "#8a0021" },
    [
      "Zion Suzuki", "Henry Heroki Mochizuki", "Ayumu Seko", "Junnosuke Suzuki",
      "Shogo Taniguchi", "Tsuyoshi Watanabe", "Kaishu Sano", "Yuki Soma",
      "Ao Tanaka", "Daichi Kamada", "Takefusa Kubo",
      "Ritsu Doan", "Keito Nakamura", "Takumi Minamino", "Shuto Machino",
      "Junya Ito", "Koki Ogawa", "Ayase Ueda",
    ]),

  team("SWE", "Sweden", "Suecia", "F",
    "Svenska Fotbollförbundet",
    "se",
    { primary: "#006aa7", secondary: "#fecc02", accent: "#00497a" },
    [
      "Viktor Johansson", "Isak Hien", "Gabriel Gudmundsson", "Emil Holm",
      "Victor Nilsson Lindelöf", "Gustaf Lagerbielke", "Lucas Bergvall", "Hugo Larsson",
      "Jesper Karlström", "Yasin Ayari", "Mattias Svanberg",
      "Daniel Svensson", "Ken Sema", "Roony Bardghji", "Dejan Kulusevski",
      "Anthony Elanga", "Alexander Isak", "Viktor Gyökeres",
    ]),

  team("TUN", "Tunisia", "Túnez", "F",
    "Fédération Tunisienne de Football",
    "tn",
    { primary: "#e70013", secondary: "#ffffff", accent: "#a0000d" },
    [
      "Béchir Ben Saïd", "Aymen Dahmen", "Yan Valery", "Montassar Talbi",
      "Yassine Meriah", "Ali Abdi", "Dylan Bronn", "Ellyes Skhiri",
      "Aïssa Laïdouni", "Ferjani Sassi", "Mohamed Ali Ben Romdhane",
      "Hannibal Mejbri", "Elias Achouri", "Elias Saad", "Hazem Mastouri",
      "Ismaël Gharbi", "Sayfallah Ltaief", "Naïm Sliti",
    ]),

  // ============ GRUPO G ============
  team("BEL", "Belgium", "Bélgica", "G",
    "Union Royale Belge des Sociétés de Football-Association",
    "be",
    { primary: "#000000", secondary: "#fae042", accent: "#ed2939" },
    [
      "Thibaut Courtois", "Arthur Theate", "Timothy Castagne", "Zeno Debast",
      "Brandon Mechele", "Maxim De Cuyper", "Thomas Meunier", "Youri Tielemans",
      "Amadou Onana", "Nicolas Raskin", "Alexis Saelemaekers",
      "Hans Vanaken", "Kevin De Bruyne", "Jérémy Doku", "Charles De Ketelaere",
      "Leandro Trossard", "Loïs Openda", "Romelu Lukaku",
    ]),

  team("EGY", "Egypt", "Egipto", "G",
    "Egyptian Football Association",
    "eg",
    { primary: "#ce1126", secondary: "#000000", accent: "#c09300" },
    [
      "Mohamed El Shenawy", "Mohamed Hany", "Mohamed Hamdy", "Yasser Ibrahim",
      "Khaled Sobhi", "Ramy Rabia", "Hossam Abdelmaguid", "Ahmed Fatouh",
      "Marwan Attia", "Zizo", "Hamdy Fathy",
      "Mohamed Lasheen", "Emam Ashour", "Osama Faisal", "Mohamed Salah",
      "Mostafa Mohamed", "Trezeguet", "Omar Marmoush",
    ]),

  team("IRN", "IR Iran", "Irán", "G",
    "Football Federation Islamic Republic of Iran",
    "ir",
    { primary: "#239f40", secondary: "#da0000", accent: "#ffffff" },
    [
      "Alireza Beiranvand", "Morteza Pouraliganji", "Ehsan Hajsafi", "Milad Mohammadi",
      "Shojae Khalilzadeh", "Ramin Rezaeian", "Hossein Kanaani", "Sadegh Moharrami",
      "Saleh Hardani", "Saeed Ezatolahi", "Saman Ghoddos",
      "Omid Noorafkan", "Roozbeh Cheshmi", "Mohammad Mohebi", "Sardar Azmoun",
      "Mehdi Taremi", "Alireza Jahanbakhsh", "Ali Gholizadeh",
    ]),

  team("NZL", "New Zealand", "Nueva Zelanda", "G",
    "New Zealand Football",
    "nz",
    { primary: "#00247d", secondary: "#cc142b", accent: "#ffffff" },
    [
      "Max Crocombe", "Alex Paulsen", "Michael Boxall", "Liberato Cacace",
      "Tim Payne", "Tyler Bindon", "Francis de Vries", "Finn Surman",
      "Joe Bell", "Sarpreet Singh", "Ryan Thomas",
      "Matthew Garbett", "Marko Stamenić", "Ben Old", "Chris Wood",
      "Elijah Just", "Callum McCowatt", "Kosta Barbarouses",
    ]),

  // ============ GRUPO H ============
  team("ESP", "Spain", "España", "H",
    "Real Federación Española de Fútbol",
    "es",
    { primary: "#aa151b", secondary: "#f1bf00", accent: "#7a0e13" },
    [
      "Unai Simón", "Robin Le Normand", "Aymeric Laporte", "Dean Huijsen",
      "Pedro Porro", "Dani Carvajal", "Marc Cucurella", "Martín Zubimendi",
      "Rodri", "Pedri", "Fabián Ruiz",
      "Mikel Merino", "Lamine Yamal", "Dani Olmo", "Nico Williams",
      "Ferran Torres", "Álvaro Morata", "Mikel Oyarzabal",
    ]),

  team("CPV", "Cabo Verde", "Cabo Verde", "H",
    "Federação Cabo-verdiana de Futebol",
    "cv",
    { primary: "#003893", secondary: "#cf2027", accent: "#f7d116" },
    [
      "Vozinha", "Logan Costa", "Pico", "Diney",
      "Steven Moreira", "Wagner Pina", "João Paulo", "Yannick Semedo",
      "Kevin Pina", "Patrick Andrade", "Jamiro Monteiro",
      "Deroy Duarte", "Garry Rodrigues", "Jovane Cabral", "Ryan Mendes",
      "Dailon Livramento", "Willy Semedo", "Bebé",
    ]),

  team("KSA", "Saudi Arabia", "Arabia Saudí", "H",
    "Saudi Arabian Football Federation",
    "sa",
    { primary: "#006c35", secondary: "#ffffff", accent: "#004822" },
    [
      "Nawaf Alaqidi", "Abdulrahman Al-Sanbi", "Saud Abdulhamid", "Nawaf Bouwashl",
      "Jihad Thakri", "Moteb Al-Harbi", "Hassan Altambakti", "Musab Aljuwayr",
      "Ziyad Aljohani", "Abdullah Alkhaibari", "Nasser Aldawsari",
      "Saleh Abu Alshamat", "Marwan Alsahafi", "Salem Aldawsari", "Abdulrahman Al-Aboud",
      "Feras Akbrikan", "Saleh Alshehri", "Abdullah Al-Hamdan",
    ]),

  team("URU", "Uruguay", "Uruguay", "H",
    "Asociación Uruguaya de Fútbol",
    "uy",
    { primary: "#0093dd", secondary: "#fcd116", accent: "#ffffff" },
    [
      "Sergio Rochet", "Santiago Mele", "Ronald Araújo", "José María Giménez",
      "Sebastián Cáceres", "Mathías Olivera", "Guillermo Varela", "Nahitan Nández",
      "Federico Valverde", "Giorgian De Arrascaeta", "Rodrigo Bentancur",
      "Manuel Ugarte", "Nicolás de la Cruz", "Maxi Araújo", "Darwin Núñez",
      "Federico Viñas", "Rodrigo Aguirre", "Facundo Pellistri",
    ]),

  // ============ GRUPO I ============
  team("FRA", "France", "Francia", "I",
    "Fédération Française de Football",
    "fr",
    { primary: "#0055a4", secondary: "#ef4135", accent: "#ffffff" },
    [
      "Mike Maignan", "Théo Hernández", "William Saliba", "Jules Koundé",
      "Ibrahima Konaté", "Dayot Upamecano", "Lucas Digne", "Aurélien Tchouaméni",
      "Eduardo Camavinga", "Manu Koné", "Adrien Rabiot",
      "Michael Olise", "Ousmane Dembélé", "Bradley Barcola", "Désiré Doué",
      "Kingsley Coman", "Hugo Ekitiké", "Kylian Mbappé",
    ]),

  team("SEN", "Senegal", "Senegal", "I",
    "Fédération Sénégalaise de Football",
    "sn",
    { primary: "#00853f", secondary: "#fdef42", accent: "#e31b23" },
    [
      "Édouard Mendy", "Yehvann Diouf", "Moussa Niakhaté", "Abdoulaye Seck",
      "Ismail Jakobs", "El Hadji Malick Diouf", "Kalidou Koulibaly", "Idrissa Gana Gueye",
      "Pape Matar Sarr", "Pape Gueye", "Habib Diarra",
      "Lamine Camara", "Sadio Mané", "Ismaïla Sarr", "Boulaye Dia",
      "Iliman Ndiaye", "Nicolas Jackson", "Krépin Diatta",
    ]),

  team("IRQ", "Iraq", "Irak", "I",
    "Iraqi Football Association",
    "iq",
    { primary: "#ce1126", secondary: "#000000", accent: "#007a3d" },
    [
      "Jalal Hassan", "Rebin Sulaka", "Hussein Ali", "Akam Hashem",
      "Merchas Doski", "Zaid Tahseen", "Manaf Younis", "Zidane Iqbal",
      "Amir Al-Ammari", "Ibrahim Bayesh", "Ali Jasim",
      "Youssef Amyn", "Aimar Sher", "Marko Farji", "Osama Rashid",
      "Ali Al-Hamadi", "Aymen Hussein", "Mohanad Ali",
    ]),

  team("NOR", "Norway", "Noruega", "I",
    "Norges Fotballforbund",
    "no",
    { primary: "#ba0c2f", secondary: "#00205b", accent: "#ffffff" },
    [
      "Ørjan Nyland", "Julian Ryerson", "Leo Østigård", "Kristoffer Vassbakk Ajer",
      "Marcus Holmgren Pedersen", "David Møller Wolfe", "Torbjørn Heggem", "Morten Thorsby",
      "Martin Ødegaard", "Sander Berge", "Andreas Schjelderup",
      "Patrick Berg", "Erling Haaland", "Alexander Sørloth", "Aron Dønnum",
      "Jørgen Strand Larsen", "Antonio Nusa", "Oscar Bobb",
    ]),

  // ============ GRUPO J ============
  team("ARG", "Argentina", "Argentina", "J",
    "Asociación del Fútbol Argentino",
    "ar",
    { primary: "#74acdf", secondary: "#ffffff", accent: "#f6b40e" },
    [
      "Emiliano Martínez", "Nahuel Molina", "Cristian Romero", "Nicolás Otamendi",
      "Nicolás Tagliafico", "Leonardo Balerdi", "Enzo Fernández", "Alexis Mac Allister",
      "Rodrigo De Paul", "Exequiel Palacios", "Leandro Paredes",
      "Nico Paz", "Franco Mastantuono", "Nico González", "Lionel Messi",
      "Lautaro Martínez", "Julián Álvarez", "Giuliano Simeone",
    ]),

  team("ALG", "Algeria", "Argelia", "J",
    "Fédération Algérienne de Football",
    "dz",
    { primary: "#006233", secondary: "#d21034", accent: "#ffffff" },
    [
      "Alexis Guendouz", "Ramy Bensebaini", "Youcef Atal", "Rayan Aït-Nouri",
      "Mohamed Amine Tougai", "Aïssa Mandi", "Ismaël Bennacer", "Houssem Aouar",
      "Hicham Boudaoui", "Ramiz Zerrouki", "Nabil Bentaleb",
      "Farès Chaïbi", "Riyad Mahrez", "Saïd Benrahma", "Anis Hadj Moussa",
      "Amine Gouiri", "Baghdad Bounedjah", "Mohamed Amoura",
    ]),

  team("AUT", "Austria", "Austria", "J",
    "Österreichischer Fußball-Bund",
    "at",
    { primary: "#ed2939", secondary: "#ffffff", accent: "#a80815" },
    [
      "Alexander Schlager", "Patrick Pentz", "David Alaba", "Kevin Danso",
      "Philipp Lienhart", "Stefan Posch", "Phillipp Mwene", "Alexander Prass",
      "Xaver Schlager", "Marcel Sabitzer", "Konrad Laimer",
      "Florian Grillitsch", "Nicolas Seiwald", "Romano Schmid", "Patrick Wimmer",
      "Christoph Baumgartner", "Michael Gregoritsch", "Marko Arnautović",
    ]),

  team("JOR", "Jordan", "Jordania", "J",
    "Jordan Football Association",
    "jo",
    { primary: "#000000", secondary: "#007a3d", accent: "#ce1126" },
    [
      "Yazeed Abulaila", "Ihsan Haddad", "Mohammad Abu Hashish", "Yazan Al-Arab",
      "Abdallah Nasib", "Saleem Obaid", "Mohammad Abu Al-Nadi", "Ibrahim Saadeh",
      "Nizar Al-Rashdan", "Noor Al-Rawabdeh", "Mohannad Abu Taha",
      "Amer Jamous", "Mousa Al-Taamari", "Yazan Al-Naimat", "Mahmoud Al-Mardi",
      "Ali Olwan", "Mohammad Abu Zrayq", "Ibrahim Sabra",
    ]),

  // ============ GRUPO K ============
  team("POR", "Portugal", "Portugal", "K",
    "Federação Portuguesa de Futebol",
    "pt",
    { primary: "#046a38", secondary: "#da291c", accent: "#ffe600" },
    [
      "Diogo Costa", "José Sá", "Rúben Dias", "João Cancelo",
      "Diogo Dalot", "Nuno Mendes", "Gonçalo Inácio", "Bernardo Silva",
      "Bruno Fernandes", "Rúben Neves", "Vitinha",
      "João Neves", "Cristiano Ronaldo", "Francisco Trincão", "João Félix",
      "Gonçalo Ramos", "Pedro Neto", "Rafael Leão",
    ]),

  team("COD", "Congo DR", "Congo RD", "K",
    "Fédération Congolaise de Football Association",
    "cd",
    { primary: "#007fff", secondary: "#f7d618", accent: "#ce1021" },
    [
      "Lionel Mpasi", "Aaron Wan-Bissaka", "Axel Tuanzebe", "Arthur Masuaku",
      "Chancel Mbemba", "Joris Kayembe", "Charles Pickel", "Ngal'ayel Mukau",
      "Edo Kayembe", "Samuel Moutoussamy", "Noah Sadiki",
      "Théo Bongonda", "Meschack Elia", "Yoane Wissa", "Brian Cipenga",
      "Fiston Mayele", "Cédric Bakambu", "Nathanaël Mbuku",
    ]),

  team("UZB", "Uzbekistan", "Uzbekistán", "K",
    "O'zbekiston Futbol Assotsiatsiyasi",
    "uz",
    { primary: "#0099b5", secondary: "#1eb53a", accent: "#ce1126" },
    [
      "Utkir Yusupov", "Farrukh Sayfiev", "Sherzod Nasrullaev", "Umar Eshmurodov",
      "Husniddin Aliqulov", "Rustamjon Ashurmatov", "Khojiakbar Alijonov", "Abdukodir Khusanov",
      "Odiljon Hamrobekov", "Otabek Shukurov", "Jamshid Iskanderov",
      "Azizbek Turgunboev", "Khojimat Erkinov", "Eldor Shomurodov", "Oston Urunov",
      "Jaloliddin Masharipov", "Igor Sergeev", "Abbosbek Fayzullaev",
    ]),

  team("COL", "Colombia", "Colombia", "K",
    "Federación Colombiana de Fútbol",
    "co",
    { primary: "#fcd116", secondary: "#003893", accent: "#ce1126" },
    [
      "Camilo Vargas", "David Ospina", "Dávinson Sánchez", "Yerry Mina",
      "Daniel Muñoz", "Johan Mojica", "Jhon Lucumí", "Santiago Arias",
      "Jefferson Lerma", "Kevin Castaño", "Richard Ríos",
      "James Rodríguez", "Juan Fernando Quintero", "Jorge Carrascal", "Jhon Arias",
      "Jhon Córdoba", "Luis Suárez", "Luis Díaz",
    ]),

  // ============ GRUPO L ============
  team("ENG", "England", "Inglaterra", "L",
    "The Football Association",
    "gb-eng",
    { primary: "#ce1124", secondary: "#ffffff", accent: "#012169" },
    [
      "Jordan Pickford", "John Stones", "Marc Guéhi", "Ezri Konsa",
      "Trent Alexander-Arnold", "Reece James", "Dan Burn", "Jordan Henderson",
      "Declan Rice", "Jude Bellingham", "Cole Palmer",
      "Morgan Rogers", "Anthony Gordon", "Phil Foden", "Bukayo Saka",
      "Harry Kane", "Marcus Rashford", "Ollie Watkins",
    ]),

  team("CRO", "Croatia", "Croacia", "L",
    "Hrvatski nogometni savez",
    "hr",
    { primary: "#ff0000", secondary: "#171796", accent: "#ffffff" },
    [
      "Dominik Livaković", "Duje Ćaleta-Car", "Joško Gvardiol", "Josip Stanišić",
      "Luka Vušković", "Josip Šutalo", "Kristijan Jakić", "Luka Modrić",
      "Mateo Kovačić", "Martin Baturina", "Lovro Majer",
      "Mario Pašalić", "Petar Sučić", "Ivan Perišić", "Marco Pašalić",
      "Ante Budimir", "Andrej Kramarić", "Franjo Ivanović",
    ]),

  team("GHA", "Ghana", "Ghana", "L",
    "Ghana Football Association",
    "gh",
    { primary: "#cf0921", secondary: "#fcd116", accent: "#006b3f" },
    [
      "Lawrence Ati Zigi", "Tariq Lamptey", "Mohammed Salisu", "Alidu Seidu",
      "Alexander Djiku", "Gideon Mensah", "Caleb Yirenkyi", "Abdul Issahaku Fatawu",
      "Thomas Partey", "Salis Abdul Samed", "Kamaldeen Sulemana",
      "Mohammed Kudus", "Iñaki Williams", "Jordan Ayew", "André Ayew",
      "Joseph Paintsil", "Osman Bukari", "Antoine Semenyo",
    ]),

  team("PAN", "Panama", "Panamá", "L",
    "Federación Panameña de Fútbol",
    "pa",
    { primary: "#005293", secondary: "#d21034", accent: "#ffffff" },
    [
      "Orlando Mosquera", "Luis Mejía", "Fidel Escobar", "Andrés Andrade",
      "Michael Amir Murillo", "Eric Davis", "José Córdoba", "César Blackman",
      "Cristian Martínez", "Aníbal Godoy", "Adalberto Carrasquilla",
      "Édgar Bárcenas", "Carlos Harvey", "Ismael Díaz", "José Fajardo",
      "Cecilio Waterman", "José Luis Rodríguez", "Alberto Quintero",
    ]),
];

// ============ FWC ESPECIALES ============
// 20 láminas: "00" + FWC1-19
// FWC1-8 = intro (logos, mascotas, lema, balón, países sede)
// FWC9-19 = historia del mundial
export const SPECIAL_STICKERS: Sticker[] = [
  { id: "FWC-0", code: "FWC", number: 0, numberLabel: "00", kind: "special", category: "intro",
    name: "Panini Logo / We Are Panini", foil: true },
  { id: "FWC-1", code: "FWC", number: 1, kind: "special", category: "intro",
    name: "Official Emblem", foil: true },
  { id: "FWC-2", code: "FWC", number: 2, kind: "special", category: "intro",
    name: "Official Emblem", foil: true },
  { id: "FWC-3", code: "FWC", number: 3, kind: "special", category: "intro",
    name: "Official Mascots", foil: true },
  { id: "FWC-4", code: "FWC", number: 4, kind: "special", category: "intro",
    name: "Official Slogan", foil: true },
  { id: "FWC-5", code: "FWC", number: 5, kind: "special", category: "intro",
    name: "Official Ball", foil: true },
  { id: "FWC-6", code: "FWC", number: 6, kind: "special", category: "host",
    name: "Canadá — País sede", foil: true },
  { id: "FWC-7", code: "FWC", number: 7, kind: "special", category: "host",
    name: "México — País sede", foil: true },
  { id: "FWC-8", code: "FWC", number: 8, kind: "special", category: "host",
    name: "Estados Unidos — País sede", foil: true },

  // Historia (FOIL)
  { id: "FWC-9",  code: "FWC", number: 9,  kind: "special", category: "history", name: "Italia 1934", foil: true },
  { id: "FWC-10", code: "FWC", number: 10, kind: "special", category: "history", name: "Uruguay 1950", foil: true },
  { id: "FWC-11", code: "FWC", number: 11, kind: "special", category: "history", name: "Alemania Occidental 1954", foil: true },
  { id: "FWC-12", code: "FWC", number: 12, kind: "special", category: "history", name: "Brasil 1962", foil: true },
  { id: "FWC-13", code: "FWC", number: 13, kind: "special", category: "history", name: "Alemania Occidental 1974", foil: true },
  { id: "FWC-14", code: "FWC", number: 14, kind: "special", category: "history", name: "Argentina 1986", foil: true },
  { id: "FWC-15", code: "FWC", number: 15, kind: "special", category: "history", name: "Brasil 1994", foil: true },
  { id: "FWC-16", code: "FWC", number: 16, kind: "special", category: "history", name: "Brasil 2002", foil: true },
  { id: "FWC-17", code: "FWC", number: 17, kind: "special", category: "history", name: "Italia 2006", foil: true },
  { id: "FWC-18", code: "FWC", number: 18, kind: "special", category: "history", name: "Alemania 2014", foil: true },
  { id: "FWC-19", code: "FWC", number: 19, kind: "special", category: "history", name: "Argentina 2022", foil: true },
];

export const ALL_STICKERS: Sticker[] = [
  ...SPECIAL_STICKERS,
  ...TEAMS.flatMap((t) => t.stickers),
];

export const GROUPS: Record<string, string[]> = {
  A: ["MEX", "RSA", "KOR", "CZE"],
  B: ["CAN", "BIH", "QAT", "SUI"],
  C: ["BRA", "MAR", "HAI", "SCO"],
  D: ["USA", "PAR", "AUS", "TUR"],
  E: ["GER", "CUW", "CIV", "ECU"],
  F: ["NED", "JPN", "SWE", "TUN"],
  G: ["BEL", "EGY", "IRN", "NZL"],
  H: ["ESP", "CPV", "KSA", "URU"],
  I: ["FRA", "SEN", "IRQ", "NOR"],
  J: ["ARG", "ALG", "AUT", "JOR"],
  K: ["POR", "COD", "UZB", "COL"],
  L: ["ENG", "CRO", "GHA", "PAN"],
};

export const TOTAL_STICKERS = ALL_STICKERS.length;

export function findTeam(code: string): Team | undefined {
  return TEAMS.find((t) => t.code.toLowerCase() === code.toLowerCase());
}

export function findSticker(id: string): Sticker | undefined {
  return ALL_STICKERS.find((s) => s.id === id);
}
