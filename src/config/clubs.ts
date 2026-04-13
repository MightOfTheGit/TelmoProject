export interface Club {
  name: string;
  aliases: string[];
  ticketUrl: string;
  logoUrl: string;
}

export const CLUBS: Club[] = [
  {
    name: 'FC Barcelona',
    aliases: ['barcelona', 'barca', 'fcb', 'fc barcelona'],
    ticketUrl: 'https://www.fcbarcelona.com/en/tickets',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg',
  },
  {
    name: 'Real Madrid',
    aliases: ['real madrid', 'madrid', 'rmcf'],
    ticketUrl: 'https://www.realmadrid.com/en/tickets',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg',
  },
  {
    name: 'Manchester United',
    aliases: ['manchester united', 'man utd', 'man united', 'mufc'],
    ticketUrl: 'https://www.manutd.com/en/tickets',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg',
  },
  {
    name: 'Manchester City',
    aliases: ['manchester city', 'man city', 'mcfc'],
    ticketUrl: 'https://www.mancity.com/tickets',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg',
  },
  {
    name: 'Liverpool FC',
    aliases: ['liverpool', 'lfc'],
    ticketUrl: 'https://www.liverpoolfc.com/tickets',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg',
  },
  {
    name: 'Arsenal FC',
    aliases: ['arsenal', 'afc', 'the gunners'],
    ticketUrl: 'https://www.arsenal.com/tickets',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg',
  },
  {
    name: 'Chelsea FC',
    aliases: ['chelsea', 'cfc', 'the blues'],
    ticketUrl: 'https://www.chelseafc.com/en/tickets',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg',
  },
  {
    name: 'Juventus',
    aliases: ['juventus', 'juve'],
    ticketUrl: 'https://www.juventus.com/en/tickets',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Juventus_FC_2017_icon_%28black%29.svg',
  },
  {
    name: 'AC Milan',
    aliases: ['ac milan', 'milan', 'acm'],
    ticketUrl: 'https://www.acmilan.com/en/tickets',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_of_AC_Milan.svg',
  },
  {
    name: 'Bayern Munich',
    aliases: ['bayern', 'bayern munich', 'fcb munich', 'fc bayern'],
    ticketUrl: 'https://fcbayern.com/en/tickets',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg',
  },
  {
    name: 'Paris Saint-Germain',
    aliases: ['psg', 'paris saint-germain', 'paris sg'],
    ticketUrl: 'https://www.psg.fr/en/tickets',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg',
  },
  {
    name: 'Atletico Madrid',
    aliases: ['atletico', 'atletico madrid', 'atm'],
    ticketUrl: 'https://www.atleticodemadrid.com/entradas',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_Madrid_2017_logo.svg',
  },
];

export function findClubsInQuery(query: string): Club[] {
  const lower = query.toLowerCase();
  return CLUBS.filter(club =>
    club.aliases.some(alias => lower.includes(alias))
  );
}
