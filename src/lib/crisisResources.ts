export interface CrisisResource {
  name: string;
  description: string;
  action: string;
  href: string;
  external?: boolean;
}

export interface CrisisCategory {
  emoji: string;
  title: string;
  getHelp: CrisisResource[];
  giveHelp: CrisisResource[];
}

export const CRISIS_CATEGORIES: CrisisCategory[] = [
  {
    emoji: "🧠",
    title: "Mental Health & Suicide Prevention",
    getHelp: [
      {
        name: "988 Suicide & Crisis Lifeline",
        description: "Free, confidential support for people in distress. Available 24/7.",
        action: "Call or text 988",
        href: "tel:988",
      },
      {
        name: "Crisis Text Line",
        description: "Text-based crisis counseling for anyone in any type of crisis.",
        action: "Text HOME to 741741",
        href: "sms:741741?body=HOME",
      },
      {
        name: "NAMI Helpline",
        description: "Information, referrals, and support for mental health conditions.",
        action: "Call 1-800-950-6264",
        href: "tel:18009506264",
      },
    ],
    giveHelp: [
      {
        name: "National Alliance on Mental Illness",
        description: "Advocacy, education, and support for those affected by mental illness.",
        action: "Donate to NAMI",
        href: "https://www.nami.org/donate",
        external: true,
      },
      {
        name: "Mental Health America",
        description: "Promoting mental health as a critical part of overall wellness.",
        action: "Support MHA",
        href: "https://mhanational.org/donate",
        external: true,
      },
    ],
  },
  {
    emoji: "🏳️‍🌈",
    title: "LGBTQ+ Youth",
    getHelp: [
      {
        name: "The Trevor Project",
        description: "Crisis intervention for LGBTQ+ young people. Call, text, or chat.",
        action: "Call 1-866-488-7386",
        href: "tel:18664887386",
      },
      {
        name: "Trans Lifeline",
        description: "Peer support for trans people, by trans people.",
        action: "Call 1-877-565-8860",
        href: "tel:18775658860",
      },
    ],
    giveHelp: [
      {
        name: "The Trevor Project",
        description: "Fund crisis services for LGBTQ+ youth worldwide.",
        action: "Donate to Trevor",
        href: "https://give.thetrevorproject.org",
        external: true,
      },
      {
        name: "PFLAG",
        description: "Supporting LGBTQ+ individuals, families, and allies.",
        action: "Support PFLAG",
        href: "https://pflag.org/donate",
        external: true,
      },
    ],
  },
  {
    emoji: "🤛",
    title: "Domestic Violence & Abuse",
    getHelp: [
      {
        name: "National Domestic Violence Hotline",
        description: "Confidential support for anyone affected by domestic violence.",
        action: "Call 1-800-799-7233",
        href: "tel:18007997233",
      },
      {
        name: "Childhelp National Child Abuse Hotline",
        description: "Professional counselors for children and adults affected by abuse.",
        action: "Call 1-800-422-4453",
        href: "tel:18004224453",
      },
    ],
    giveHelp: [
      {
        name: "National Network to End Domestic Violence",
        description: "Policy advocacy and direct services for survivors.",
        action: "Donate to NNEDV",
        href: "https://nnedv.org/donate/",
        external: true,
      },
      {
        name: "RAINN",
        description: "Nation's largest anti-sexual violence organization.",
        action: "Support RAINN",
        href: "https://www.rainn.org/donate",
        external: true,
      },
    ],
  },
  {
    emoji: "💊",
    title: "Substance Abuse & Addiction",
    getHelp: [
      {
        name: "SAMHSA National Helpline",
        description: "Free referrals for substance abuse and mental health treatment. 24/7.",
        action: "Call 1-800-662-4357",
        href: "tel:18006624357",
      },
      {
        name: "Alcoholics Anonymous",
        description: "Find a local AA meeting or connect with the community.",
        action: "Find a meeting",
        href: "https://www.aa.org/find-aa",
        external: true,
      },
    ],
    giveHelp: [
      {
        name: "Shatterproof",
        description: "Ending the devastation addiction causes families.",
        action: "Donate to Shatterproof",
        href: "https://www.shatterproof.org/donate",
        external: true,
      },
    ],
  },
  {
    emoji: "🎖️",
    title: "Veterans & Military Families",
    getHelp: [
      {
        name: "Veterans Crisis Line",
        description: "Confidential support for veterans and their loved ones.",
        action: "Call 988, press 1",
        href: "tel:988",
      },
      {
        name: "Give an Hour",
        description: "Free mental health services for military and their families.",
        action: "Find help",
        href: "https://giveanhour.org",
        external: true,
      },
    ],
    giveHelp: [
      {
        name: "Wounded Warrior Project",
        description: "Programs and services for wounded veterans.",
        action: "Support WWP",
        href: "https://www.woundedwarriorproject.org/donate",
        external: true,
      },
      {
        name: "Team Rubicon",
        description: "Veterans serving communities through disaster response.",
        action: "Support Team Rubicon",
        href: "https://teamrubiconusa.org/donate",
        external: true,
      },
    ],
  },
  {
    emoji: "🌍",
    title: "Human Rights & Global Crises",
    getHelp: [
      {
        name: "International Association for Suicide Prevention",
        description: "Crisis centers around the world. Find help in your country.",
        action: "Find a crisis center",
        href: "https://www.iasp.info/resources/Crisis_Centres/",
        external: true,
      },
      {
        name: "UNHCR",
        description: "The UN Refugee Agency — protection and assistance for refugees.",
        action: "Get help",
        href: "https://help.unhcr.org",
        external: true,
      },
    ],
    giveHelp: [
      {
        name: "Doctors Without Borders",
        description: "Medical care where it's needed most — conflict zones, epidemics, disasters.",
        action: "Donate to MSF",
        href: "https://donate.doctorswithoutborders.org",
        external: true,
      },
      {
        name: "International Rescue Committee",
        description: "Emergency aid and long-term assistance for refugees and displaced people.",
        action: "Support IRC",
        href: "https://www.rescue.org/donate",
        external: true,
      },
    ],
  },
  {
    emoji: "🍽️",
    title: "Hunger & Food Insecurity",
    getHelp: [
      {
        name: "Feeding America",
        description: "Find a local food bank near you.",
        action: "Find food",
        href: "https://www.feedingamerica.org/find-your-local-foodbank",
        external: true,
      },
    ],
    giveHelp: [
      {
        name: "World Food Programme",
        description: "The world's largest humanitarian organization fighting hunger.",
        action: "Donate to WFP",
        href: "https://www.wfp.org/donate",
        external: true,
      },
      {
        name: "Feeding America",
        description: "A nationwide network of 200+ food banks and 60,000 pantries.",
        action: "Donate to Feeding America",
        href: "https://www.feedingamerica.org/donate",
        external: true,
      },
    ],
  },
  {
    emoji: "🏠",
    title: "Homelessness & Housing",
    getHelp: [
      {
        name: "National Alliance to End Homelessness",
        description: "Resources and policy solutions for homelessness.",
        action: "Find resources",
        href: "https://endhomelessness.org",
        external: true,
      },
      {
        name: "211 Helpline",
        description: "Connect with local housing assistance, shelters, and social services.",
        action: "Call 211 or visit 211.org",
        href: "tel:211",
      },
    ],
    giveHelp: [
      {
        name: "Habitat for Humanity",
        description: "Building homes, communities, and hope.",
        action: "Donate to Habitat",
        href: "https://www.habitat.org/donate",
        external: true,
      },
    ],
  },
];
