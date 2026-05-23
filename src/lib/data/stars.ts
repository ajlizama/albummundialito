// AUTO-GENERADO por scripts/fetch-stars.ts
// Estrellas del Mundial 2026 agrupadas por tier.
// stickerId apunta a la lámina del jugador en el roster actual;
// cuando el usuario pega esa lámina, la foto del jugador se "prende".

export interface Star {
  name: string;
  teamCode: string;
  note?: string;
  stickerId?: string;
  photoUrl?: string;
  wikiUrl?: string;
}

export interface StarTier {
  label: string;
  subtitle: string;
  stars: Star[];
}

export const STAR_TIERS: StarTier[] = [
  {
    label: "Estrellas máximas",
    subtitle: "Los 7 que cargan el peso del torneo",
    stars: [
        {
            "name": "Lionel Messi",
            "teamCode": "ARG",
            "note": "Su último Mundial",
            "stickerId": "ARG-17",
            "wikiUrl": "https://es.wikipedia.org/wiki/Lionel_Messi",
            "photoUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Lionel-Messi-Argentina-2022-FIFA-World-Cup_%28cropped%29.jpg/330px-Lionel-Messi-Argentina-2022-FIFA-World-Cup_%28cropped%29.jpg"
        },
        {
            "name": "Cristiano Ronaldo",
            "teamCode": "POR",
            "note": "Su despedida mundialista",
            "stickerId": "POR-15",
            "wikiUrl": "https://es.wikipedia.org/wiki/Cristiano_Ronaldo",
            "photoUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Cristiano_Ronaldo_playing_for_Al_Nassr_FC_against_Persepolis%2C_September_2023_%28cropped%29.jpg/330px-Cristiano_Ronaldo_playing_for_Al_Nassr_FC_against_Persepolis%2C_September_2023_%28cropped%29.jpg"
        },
        {
            "name": "Kylian Mbappé",
            "teamCode": "FRA",
            "stickerId": "FRA-20",
            "wikiUrl": "https://es.wikipedia.org/wiki/Kylian_Mbapp%C3%A9",
            "photoUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Picture_with_Mbapp%C3%A9_%28cropped%29_%28cropped%29.jpg/330px-Picture_with_Mbapp%C3%A9_%28cropped%29_%28cropped%29.jpg"
        },
        {
            "name": "Lamine Yamal",
            "teamCode": "ESP",
            "stickerId": "ESP-15",
            "wikiUrl": "https://es.wikipedia.org/wiki/Lamine_Yamal",
            "photoUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Lamine_Yamal_in_2025.jpg/330px-Lamine_Yamal_in_2025.jpg"
        },
        {
            "name": "Erling Haaland",
            "teamCode": "NOR",
            "stickerId": "NOR-15",
            "wikiUrl": "https://es.wikipedia.org/wiki/Erling_Haaland",
            "photoUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Erling_Haaland_June_2025.jpg/330px-Erling_Haaland_June_2025.jpg"
        },
        {
            "name": "Vinícius Júnior",
            "teamCode": "BRA",
            "stickerId": "BRA-14",
            "wikiUrl": "https://es.wikipedia.org/wiki/Vin%C3%ADcius_J%C3%BAnior",
            "photoUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/2023_05_06_Final_de_la_Copa_del_Rey_-_52879242230_%28cropped%29.jpg/330px-2023_05_06_Final_de_la_Copa_del_Rey_-_52879242230_%28cropped%29.jpg"
        },
        {
            "name": "Jude Bellingham",
            "teamCode": "ENG",
            "stickerId": "ENG-11",
            "wikiUrl": "https://es.wikipedia.org/wiki/Jude_Bellingham",
            "photoUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/25th_Laureus_World_Sports_Awards_-_Red_Carpet_-_Jude_Bellingham_-_240422_190551-2_%28cropped%29.jpg/330px-25th_Laureus_World_Sports_Awards_-_Red_Carpet_-_Jude_Bellingham_-_240422_190551-2_%28cropped%29.jpg"
        },
        {
            "name": "Pedri",
            "teamCode": "ESP",
            "stickerId": "ESP-11",
            "wikiUrl": "https://es.wikipedia.org/wiki/Pedri",
            "photoUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Pedri.jpg/330px-Pedri.jpg"
        }
    ],
  },
  {
    label: "Figuras",
    subtitle: "Top mundial — pueden definir cualquier partido",
    stars: [
        {
            "name": "Harry Kane",
            "teamCode": "ENG",
            "stickerId": "ENG-18",
            "wikiUrl": "https://es.wikipedia.org/wiki/Harry_Kane",
            "photoUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Harry_Kane_on_October_10%2C_2023.jpg/330px-Harry_Kane_on_October_10%2C_2023.jpg"
        },
        {
            "name": "Rodri",
            "teamCode": "ESP",
            "stickerId": "ESP-10",
            "wikiUrl": "https://es.wikipedia.org/wiki/Rodri_Hern%C3%A1ndez",
            "photoUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/RODRI_-_SWE_vs_ESP_-_UEFA_EURO_2020_QUALIFIERS_-_2019.10.15_%28cropped%29.jpg/330px-RODRI_-_SWE_vs_ESP_-_UEFA_EURO_2020_QUALIFIERS_-_2019.10.15_%28cropped%29.jpg"
        },
        {
            "name": "Florian Wirtz",
            "teamCode": "GER",
            "stickerId": "GER-11",
            "wikiUrl": "https://es.wikipedia.org/wiki/Florian_Wirtz",
            "photoUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Florian_Wirtz_04012026_%283%29_%28extracted%29.jpg/330px-Florian_Wirtz_04012026_%283%29_%28extracted%29.jpg"
        },
        {
            "name": "Achraf Hakimi",
            "teamCode": "MAR",
            "stickerId": "MAR-4",
            "wikiUrl": "https://es.wikipedia.org/wiki/Achraf_Hakimi",
            "photoUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Achraf_Hakimi_vs_Niger%2C_5_Sept_2025.jpg/330px-Achraf_Hakimi_vs_Niger%2C_5_Sept_2025.jpg"
        },
        {
            "name": "Bukayo Saka",
            "teamCode": "ENG",
            "stickerId": "ENG-17",
            "wikiUrl": "https://es.wikipedia.org/wiki/Bukayo_Saka",
            "photoUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/1_bukayo_saka_arsenal_2025_%28cropped%29.jpg/330px-1_bukayo_saka_arsenal_2025_%28cropped%29.jpg"
        },
        {
            "name": "Raphinha",
            "teamCode": "BRA",
            "stickerId": "BRA-19",
            "wikiUrl": "https://es.wikipedia.org/wiki/Raphinha",
            "photoUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Raphael_Dias_Belloli_2023.jpg/330px-Raphael_Dias_Belloli_2023.jpg"
        },
        {
            "name": "Vitinha",
            "teamCode": "POR",
            "stickerId": "POR-12",
            "wikiUrl": "https://es.wikipedia.org/wiki/Vitinha",
            "photoUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Vitinha_USMNT_v_Portugal_Mar_31_2026-50.jpg/330px-Vitinha_USMNT_v_Portugal_Mar_31_2026-50.jpg"
        },
        {
            "name": "Lautaro Martínez",
            "teamCode": "ARG",
            "stickerId": "ARG-18",
            "wikiUrl": "https://en.wikipedia.org/wiki/Lautaro_Mart%C3%ADnez",
            "photoUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Lautaro_Martinez_ARGENTINA_VS_VENEZUELA_2017.jpg/330px-Lautaro_Martinez_ARGENTINA_VS_VENEZUELA_2017.jpg"
        },
        {
            "name": "Michael Olise",
            "teamCode": "FRA",
            "stickerId": "FRA-14",
            "wikiUrl": "https://es.wikipedia.org/wiki/Michael_Olise",
            "photoUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/FC_RB_Salzburg_gegen_FC_Bayern_M%C3%BCnchen_%282026-01-06_Testspiel%29_10.jpg/330px-FC_RB_Salzburg_gegen_FC_Bayern_M%C3%BCnchen_%282026-01-06_Testspiel%29_10.jpg"
        }
    ],
  },
  {
    label: "Referentes",
    subtitle: "Garantía de jerarquía en sus selecciones",
    stars: [
        {
            "name": "Virgil van Dijk",
            "teamCode": "NED",
            "stickerId": "NED-3",
            "wikiUrl": "https://es.wikipedia.org/wiki/Virgil_van_Dijk",
            "photoUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/20160604_AUT_NED_8876_%28cropped%29.jpg/330px-20160604_AUT_NED_8876_%28cropped%29.jpg"
        },
        {
            "name": "Cody Gakpo",
            "teamCode": "NED",
            "stickerId": "NED-20",
            "wikiUrl": "https://es.wikipedia.org/wiki/Cody_Gakpo",
            "photoUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Cody_Gakpo_06042025_%282%29_%28cropped%29.jpg/330px-Cody_Gakpo_06042025_%282%29_%28cropped%29.jpg"
        },
        {
            "name": "Jamal Musiala",
            "teamCode": "GER",
            "stickerId": "GER-15",
            "wikiUrl": "https://es.wikipedia.org/wiki/Jamal_Musiala",
            "photoUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Jamal_Musiala_2022_%28cropped%29.jpg/330px-Jamal_Musiala_2022_%28cropped%29.jpg"
        },
        {
            "name": "Désiré Doué",
            "teamCode": "FRA",
            "stickerId": "FRA-17",
            "wikiUrl": "https://es.wikipedia.org/wiki/D%C3%A9sir%C3%A9_Dou%C3%A9",
            "photoUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Doue_asse_psg_2425.png/330px-Doue_asse_psg_2425.png"
        },
        {
            "name": "Nico Williams",
            "teamCode": "ESP",
            "stickerId": "ESP-17",
            "wikiUrl": "https://es.wikipedia.org/wiki/Nico_Williams",
            "photoUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/ATHLETIC-OSASUNA_SEMIFINAL._MAIDER_GOIKOETXEA_%28168%29_%28cropped%29.jpg/330px-ATHLETIC-OSASUNA_SEMIFINAL._MAIDER_GOIKOETXEA_%28168%29_%28cropped%29.jpg"
        },
        {
            "name": "Alexis Mac Allister",
            "teamCode": "ARG",
            "stickerId": "ARG-9",
            "wikiUrl": "https://es.wikipedia.org/wiki/Alexis_Mac_Allister",
            "photoUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Alexis_Mac_Allister_WC_2022.jpg/330px-Alexis_Mac_Allister_WC_2022.jpg"
        },
        {
            "name": "Bruno Fernandes",
            "teamCode": "POR",
            "stickerId": "POR-10",
            "wikiUrl": "https://es.wikipedia.org/wiki/Bruno_Fernandes",
            "photoUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Portugal_national_football_team_0866_%28Bruno_Fernandes%29.jpg/330px-Portugal_national_football_team_0866_%28Bruno_Fernandes%29.jpg"
        }
    ],
  },
];

export const ALL_STARS: Star[] = STAR_TIERS.flatMap((t) => t.stars);
