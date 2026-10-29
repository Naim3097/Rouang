/**
 * Privacy notice text, English and Bahasa Malaysia.
 *
 * Structured around the eight items a written notice must cover under s.7(1) of the Personal
 * Data Protection Act 2010 (Act 709), and published in both the national language and English
 * as s.7(3) requires. Draft: needs the studio's legal name and contact details and a review by
 * its legal adviser before launch (see docs/CONFIRMATIONS.md).
 */

export type NoticeSection = { id: string; title: string; paragraphs: string[]; list?: string[] };

type Vars = { controller: string; contact: string };

export function privacyNotice({ controller, contact }: Vars): { en: NoticeSection[]; ms: NoticeSection[] } {
  return {
    en: [
      {
        id: "who",
        title: "Who we are",
        paragraphs: [
          `${controller} ("we") is the data controller for personal data collected through this website. This notice is given under the Personal Data Protection Act 2010.`,
        ],
      },
      {
        id: "what",
        title: "What we collect, and where it comes from",
        paragraphs: [
          "We collect personal data directly from you, only when you choose to send us a project enquiry:",
          "We also record the page you sent the form from and any campaign tags in the link you followed. To protect the form from spam we keep a one-way scrambled version (a hash) of your internet address for a short period. We do not store the address itself.",
        ],
        list: [
          "your name, and an email address and/or phone number;",
          "whether the project is for a home or a business, the type of space and where it is;",
          "an optional budget range and timeline;",
          "your message about the project.",
        ],
      },
      {
        id: "why",
        title: "Why we use it",
        paragraphs: [
          "We use your details to reply to your enquiry, to discuss and prepare a proposal for your project at your request, to keep a record of enquiries and how they progressed, and to protect the form against abuse. We do not sell your data and we do not use it for advertising.",
        ],
      },
      {
        id: "required",
        title: "What you have to give us",
        paragraphs: [
          "Your name, a way to reply (email or phone) and a short message are needed for us to answer your enquiry. If you leave them out we cannot reply. Everything else on the form is optional.",
        ],
      },
      {
        id: "sharing",
        title: "Who else handles it",
        paragraphs: [
          "Your details are processed on our behalf by service providers (data processors): our website host (Vercel), our database provider (Supabase) and our email provider, which notifies the studio of new enquiries. If you allow analytics cookies, Google Analytics also receives information about how the site is used. These providers may store data on servers outside Malaysia; we use them only on terms that protect your data.",
          "If your project goes ahead and you agree, we may share the details needed with contractors or suppliers working on it. We do not disclose your data to anyone else unless the law requires it.",
        ],
      },
      {
        id: "analytics",
        title: "Analytics cookies",
        paragraphs: [
          "With your permission only, we use Google Analytics to understand how people use the site, for example which pages are read and whether the enquiry form is used. It sets cookies and receives information such as the pages you visit and your type of device. Advertising features are switched off. If you say no, Google Analytics is not loaded at all. You can change your choice at any time with the \"Analytics settings\" link at the bottom of every page. Google explains how it uses this information at policies.google.com/technologies/partner-sites.",
        ],
      },
      {
        id: "rights",
        title: "Your choices and rights",
        paragraphs: [
          `You can ask to see the personal data we hold about you, ask us to correct it, ask us to limit how we use it, or withdraw your consent. Contact us at ${contact}. We may need to confirm who you are before acting on a request, and we will reply within the time the law allows.`,
        ],
      },
      {
        id: "retention",
        title: "How long we keep it",
        paragraphs: [
          "We keep enquiry details only as long as we need them for your enquiry and any project that follows, and then delete them: normally within two years of our last contact, unless we are working together or the law requires us to keep them longer.",
        ],
      },
      {
        id: "security",
        title: "Keeping it safe",
        paragraphs: [
          "Enquiries are sent over an encrypted connection and stored in a database that is not publicly readable. Only people at the studio who need them can see them. If a data breach happens that is likely to cause you significant harm, we will tell you and the Personal Data Protection Commissioner as the law requires.",
        ],
      },
      {
        id: "changes",
        title: "Changes to this notice",
        paragraphs: ["If we change how we use personal data we will update this notice and the date at the top of the page."],
      },
    ],
    ms: [
      {
        id: "siapa",
        title: "Siapa kami",
        paragraphs: [
          `${controller} ("kami") ialah pengawal data bagi data peribadi yang dikumpul melalui laman web ini. Notis ini diberikan di bawah Akta Perlindungan Data Peribadi 2010.`,
        ],
      },
      {
        id: "apa",
        title: "Data yang kami kumpul dan sumbernya",
        paragraphs: [
          "Kami mengumpul data peribadi terus daripada anda, hanya apabila anda memilih untuk menghantar pertanyaan projek:",
          "Kami juga merekodkan halaman tempat borang dihantar dan sebarang tag kempen pada pautan yang anda ikuti. Untuk melindungi borang daripada spam, kami menyimpan versi sehala (hash) alamat internet anda untuk tempoh yang singkat. Kami tidak menyimpan alamat itu sendiri.",
        ],
        list: [
          "nama anda, dan alamat e-mel dan/atau nombor telefon;",
          "sama ada projek untuk rumah atau perniagaan, jenis ruang dan lokasinya;",
          "anggaran bajet dan jangka masa (pilihan);",
          "mesej anda tentang projek.",
        ],
      },
      {
        id: "tujuan",
        title: "Tujuan kami menggunakannya",
        paragraphs: [
          "Kami menggunakan maklumat anda untuk membalas pertanyaan anda, membincangkan dan menyediakan cadangan bagi projek anda atas permintaan anda, menyimpan rekod pertanyaan dan perkembangannya, dan melindungi borang daripada penyalahgunaan. Kami tidak menjual data anda dan tidak menggunakannya untuk pengiklanan.",
        ],
      },
      {
        id: "wajib",
        title: "Maklumat yang wajib diberikan",
        paragraphs: [
          "Nama anda, cara untuk dihubungi (e-mel atau telefon) dan mesej ringkas diperlukan untuk kami membalas pertanyaan anda. Tanpa maklumat ini kami tidak dapat membalas. Maklumat lain dalam borang adalah pilihan.",
        ],
      },
      {
        id: "pihak-lain",
        title: "Pihak lain yang mengendalikan data",
        paragraphs: [
          "Maklumat anda diproses bagi pihak kami oleh pembekal perkhidmatan (pemproses data): hos laman web kami (Vercel), pembekal pangkalan data kami (Supabase) dan pembekal e-mel kami yang memaklumkan studio tentang pertanyaan baharu. Jika anda membenarkan kuki analitik, Google Analytics turut menerima maklumat tentang cara laman ini digunakan. Pembekal ini mungkin menyimpan data di pelayan di luar Malaysia; kami hanya menggunakan mereka atas terma yang melindungi data anda.",
          "Jika projek anda diteruskan dan anda bersetuju, kami mungkin berkongsi maklumat yang diperlukan dengan kontraktor atau pembekal yang terlibat. Kami tidak mendedahkan data anda kepada pihak lain melainkan jika dikehendaki oleh undang-undang.",
        ],
      },
      {
        id: "analitik",
        title: "Kuki analitik",
        paragraphs: [
          "Hanya dengan kebenaran anda, kami menggunakan Google Analytics untuk memahami cara laman ini digunakan, contohnya halaman yang dibaca dan sama ada borang pertanyaan digunakan. Ia menetapkan kuki dan menerima maklumat seperti halaman yang anda lawati dan jenis peranti anda. Ciri pengiklanan dimatikan. Jika anda menolak, Google Analytics tidak dimuatkan langsung. Anda boleh menukar pilihan anda pada bila-bila masa melalui pautan \"Analytics settings\" di bahagian bawah setiap halaman.",
        ],
      },
      {
        id: "hak",
        title: "Pilihan dan hak anda",
        paragraphs: [
          `Anda boleh meminta untuk melihat data peribadi yang kami simpan tentang anda, meminta kami membetulkannya, mengehadkan penggunaannya, atau menarik balik persetujuan anda. Hubungi kami di ${contact}. Kami mungkin perlu mengesahkan identiti anda sebelum bertindak atas permintaan, dan kami akan membalas dalam tempoh yang dibenarkan oleh undang-undang.`,
        ],
      },
      {
        id: "tempoh",
        title: "Tempoh simpanan",
        paragraphs: [
          "Kami menyimpan maklumat pertanyaan hanya selama yang diperlukan untuk pertanyaan anda dan sebarang projek berikutnya, kemudian memadamkannya: biasanya dalam tempoh dua tahun dari hubungan terakhir kita, melainkan kita sedang bekerjasama atau undang-undang menghendaki tempoh yang lebih lama.",
        ],
      },
      {
        id: "keselamatan",
        title: "Keselamatan",
        paragraphs: [
          "Pertanyaan dihantar melalui sambungan yang disulitkan dan disimpan dalam pangkalan data yang tidak boleh dibaca oleh orang awam. Hanya kakitangan studio yang memerlukannya boleh melihatnya. Jika berlaku pelanggaran data yang mungkin menyebabkan kemudaratan ketara kepada anda, kami akan memaklumkan anda dan Pesuruhjaya Perlindungan Data Peribadi seperti yang dikehendaki oleh undang-undang.",
        ],
      },
      {
        id: "perubahan",
        title: "Perubahan pada notis ini",
        paragraphs: ["Jika kami mengubah cara kami menggunakan data peribadi, kami akan mengemas kini notis ini dan tarikh di bahagian atas halaman."],
      },
    ],
  };
}
