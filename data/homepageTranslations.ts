// SHARED FILE — an identical copy lives in jmt-admin/data/homepageTranslations.ts and
// jmt-frontend/data/homepageTranslations.ts. Change both together.
//
// Built-in Bengali and Hindi translations of the bundled homepage copy.
//
// Keyed by the exact English text, so a seed only applies while that English
// is still on the page: when an admin rewrites a field, the old translation
// stops matching and the field shows English until it is translated in the
// CMS (Homepage → বাংলা / हिन्दी). Translations saved in the CMS always win.
//
// Kept short on purpose: headings and buttons should fit the same number of
// lines as the English. Brand names, PF/ESIC/PPE/MEP/JMT and "WhatsApp" stay
// in Latin script, as they are said that way on site.

type Row = readonly [en: string, bn: string, hi: string];

const ROWS: readonly Row[] = [
  // ── SEO ──
  [
    "Joy Maa Tara Bama Kripa — Site crews for bridges, metro and civil works",
    "Joy Maa Tara Bama Kripa — ব্রিজ, মেট্রো ও সিভিল কাজের সাইট ক্রু",
    "Joy Maa Tara Bama Kripa — पुल, मेट्रो और सिविल कार्यों के लिए साइट क्रू",
  ],
  [
    "Skilled and unskilled construction workers from West Bengal, fully registered, deployed fast and managed on site by our own supervisors. PF, ESIC and wage records every month.",
    "পশ্চিমবঙ্গের দক্ষ ও অদক্ষ নির্মাণ শ্রমিক — সম্পূর্ণ নথিভুক্ত, দ্রুত নিয়োগ, আমাদের নিজস্ব সুপারভাইজারের তত্ত্বাবধানে। প্রতি মাসে PF, ESIC ও মজুরির রেকর্ড।",
    "पश्चिम बंगाल के कुशल और अकुशल निर्माण श्रमिक — पूरी तरह पंजीकृत, जल्दी तैनाती, हमारे अपने सुपरवाइज़र की देखरेख में। हर महीने PF, ESIC और वेतन रिकॉर्ड।",
  ],

  // ── Navbar, footer, shared labels ──
  ["Services", "পরিষেবা", "सेवाएँ"],
  ["How we work", "কাজের ধারা", "कार्य-प्रणाली"],
  ["About", "পরিচিতি", "परिचय"],
  ["Join our crew", "ক্রু-তে যোগ দিন", "क्रू से जुड़ें"],
  ["Contact", "যোগাযোগ", "संपर्क"],
  ["Call", "কল করুন", "कॉल करें"],
  ["Company", "কোম্পানি", "कंपनी"],
  ["Site labour supply", "সাইট শ্রমিক সরবরাহ", "साइट श्रमिक आपूर्ति"],
  ["Supervision and compliance", "তত্ত্বাবধান ও কমপ্লায়েন্স", "निगरानी और अनुपालन"],
  ["Skilled trade crews", "দক্ষ কারিগর দল", "कुशल कारीगर दल"],
  ["Industrial manpower", "শিল্প শ্রমশক্তি", "औद्योगिक मैनपावर"],
  ["Sites we staff", "আমাদের সাইট", "हमारी साइटें"],
  ["Trades we supply", "আমাদের কারিগর", "हमारे कारीगर"],
  [
    "Reliable, fully compliant site crews for bridges, metro and civil works. Run by the founder, on site.",
    "ব্রিজ, মেট্রো ও সিভিল কাজের জন্য নির্ভরযোগ্য, সম্পূর্ণ নিয়মমাফিক সাইট ক্রু। প্রতিষ্ঠাতা নিজে সাইটে থেকে পরিচালনা করেন।",
    "पुल, मेट्रो और सिविल कार्यों के लिए भरोसेमंद, पूरी तरह नियमों के अनुरूप साइट क्रू। संस्थापक ख़ुद साइट पर रहकर चलाते हैं।",
  ],
  ["Mon to Sat, 8 am to 8 pm", "সোম থেকে শনি, সকাল ৮টা থেকে রাত ৮টা", "सोम से शनि, सुबह 8 से रात 8 बजे"],
  ["Within 24 hours", "২৪ ঘণ্টার মধ্যে", "24 घंटे के भीतर"],

  // ── Hero ──
  ["Labour contractor, West Bengal", "শ্রম ঠিকাদার, পশ্চিমবঙ্গ", "श्रम ठेकेदार, पश्चिम बंगाल"],
  ["Site crews for", "সাইট ক্রু —", "साइट क्रू —"],
  ["Bridges, Metro", "ব্রিজ, মেট্রো", "पुल, मेट्रो"],
  ["and Civil works.", "ও সিভিল কাজের জন্য।", "और सिविल कार्यों के लिए।"],
  [
    "Skilled and unskilled workers, fully registered, deployed fast and managed on site by our own supervisors.",
    "দক্ষ ও অদক্ষ শ্রমিক, সম্পূর্ণ নথিভুক্ত, দ্রুত সাইটে পৌঁছায় এবং আমাদের নিজস্ব সুপারভাইজারের তত্ত্বাবধানে কাজ করে।",
    "कुशल और अकुशल श्रमिक, पूरी तरह पंजीकृत, जल्दी तैनात और हमारे अपने सुपरवाइज़र की देखरेख में।",
  ],
  ["Request workers", "শ্রমিক চাই", "श्रमिक मँगाएँ"],
  ["Prefer WhatsApp?", "WhatsApp-এ কথা বলবেন?", "WhatsApp पसंद है?"],
  ["Verified Workforce", "যাচাই করা শ্রমিক", "सत्यापित श्रमिक"],
  ["Fast Development", "দ্রুত নিয়োগ", "तेज़ तैनाती"],
  ["On-Site Support", "সাইটে সহায়তা", "साइट पर सहायता"],

  // ── Services ──
  ["Site labour for every", "প্রকল্পের প্রতিটি ধাপে", "प्रोजेक्ट के हर चरण के लिए"],
  ["stage of your project", "সাইট শ্রমিক", "साइट श्रमिक"],
  [
    "From the first pour to the monthly paperwork, one team handles your site labour, with our own supervisor on every crew.",
    "প্রথম ঢালাই থেকে মাসিক কাগজপত্র পর্যন্ত, একটি দলই আপনার সাইটের শ্রমিক সামলায় — প্রতিটি ক্রুতে আমাদের নিজস্ব সুপারভাইজার।",
    "पहली ढलाई से लेकर मासिक कागज़ात तक, एक ही टीम आपकी साइट के श्रमिक सँभालती है — हर क्रू के साथ हमारा अपना सुपरवाइज़र।",
  ],
  ["Skilled, semi-skilled and unskilled", "দক্ষ, আধা-দক্ষ ও অদক্ষ", "कुशल, अर्ध-कुशल और अकुशल"],
  ["Coming soon", "শীঘ্রই আসছে", "जल्द आ रहा है"],

  // ── Sites ──
  ["Crews for the toughest sites.", "কঠিনতম সাইটের জন্য ক্রু।", "सबसे कठिन साइटों के लिए क्रू।"],
  ["Bridges and flyovers", "ব্রিজ ও ফ্লাইওভার", "पुल और फ्लाईओवर"],
  ["Piers, pile caps, decks, girders", "পিয়ার, পাইল ক্যাপ, ডেক, গার্ডার", "पियर, पाइल कैप, डेक, गर्डर"],
  ["Metro viaducts", "মেট্রো ভায়াডাক্ট", "मेट्रो वायडक्ट"],
  ["Segments, piers, night shifts", "সেগমেন্ট, পিয়ার, রাতের শিফট", "सेगमेंट, पियर, नाइट शिफ्ट"],
  ["Stations and depots", "স্টেশন ও ডিপো", "स्टेशन और डिपो"],
  ["Civil, finishing and MEP support", "সিভিল, ফিনিশিং ও MEP সহায়তা", "सिविल, फिनिशिंग और MEP सहायता"],
  ["Buildings", "ভবন", "इमारतें"],
  ["Structure, masonry, finishing", "কাঠামো, গাঁথনি, ফিনিশিং", "ढाँचा, चिनाई, फिनिशिंग"],

  // ── Why choose us ──
  ["Why contractors choose", "ঠিকাদাররা বেছে নেন", "ठेकेदारों की पसंद"],
  [
    "We only staff construction and infrastructure sites. One focus, one owner, and every paper in order.",
    "আমরা শুধু নির্মাণ ও পরিকাঠামো সাইটে শ্রমিক দিই। একটাই লক্ষ্য, একজন মালিক, আর সব কাগজপত্র ঠিকঠাক।",
    "हम सिर्फ़ निर्माण और इन्फ्रास्ट्रक्चर साइटों पर श्रमिक देते हैं। एक लक्ष्य, एक मालिक, और हर कागज़ दुरुस्त।",
  ],
  ["Founder-led, on site", "প্রতিষ্ঠাতা নিজে সাইটে", "संस्थापक ख़ुद साइट पर"],
  ["Owner on every call", "প্রতিটি কলে মালিক নিজে", "हर कॉल पर मालिक ख़ुद"],
  [
    "You deal with the founder directly, not a call centre. Decisions are made the same day.",
    "কল সেন্টার নয়, সরাসরি প্রতিষ্ঠাতার সঙ্গে কথা বলুন। সিদ্ধান্ত হয় সেদিনই।",
    "कॉल सेंटर नहीं, सीधे संस्थापक से बात करें। फ़ैसले उसी दिन होते हैं।",
  ],
  ["Direct", "সরাসরি", "सीधा"],
  ["Compliance you can show", "দেখানোর মতো কমপ্লায়েন্স", "दिखाने लायक अनुपालन"],
  [
    "PF, ESIC, wage proof and licence copies shared every month, ready for your auditor.",
    "PF, ESIC, মজুরির প্রমাণ ও লাইসেন্সের কপি প্রতি মাসে — আপনার অডিটরের জন্য প্রস্তুত।",
    "PF, ESIC, मज़दूरी के प्रमाण और लाइसेंस की प्रतियाँ हर महीने — आपके ऑडिटर के लिए तैयार।",
  ],
  ["On paper", "কাগজে-কলমে", "काग़ज़ पर"],
  ["Construction crews only", "শুধু নির্মাণ ক্রু", "सिर्फ़ निर्माण क्रू"],
  [
    "Bridges, metro, buildings and roads. That's all we staff, so our supervisors know your site.",
    "ব্রিজ, মেট্রো, ভবন ও রাস্তা — আমরা শুধু এগুলিতেই শ্রমিক দিই, তাই আমাদের সুপারভাইজাররা আপনার সাইট বোঝেন।",
    "पुल, मेट्रो, इमारतें और सड़कें — हम सिर्फ़ यहीं श्रमिक देते हैं, इसलिए हमारे सुपरवाइज़र आपकी साइट समझते हैं।",
  ],
  ["Focused", "কেন্দ্রিত", "केंद्रित"],

  // ── Trades ──
  ["The hands your site needs.", "আপনার সাইটের দরকারি হাত।", "आपकी साइट के ज़रूरी हाथ।"],
  [
    "Pick a skill level. Every worker is ID-checked and inducted.",
    "দক্ষতার স্তর বেছে নিন। প্রত্যেক শ্রমিকের পরিচয় যাচাই ও ইনডাকশন সম্পন্ন।",
    "कौशल स्तर चुनें। हर श्रमिक की पहचान जाँची और इंडक्शन पूरा।",
  ],
  ["Masonry crews", "রাজমিস্ত্রি দল", "राजमिस्त्री दल"],
  ["Shuttering and rebar crews", "শাটারিং ও রড বাঁধাই দল", "शटरिंग और सरिया दल"],
  ["Welding and rigging crews", "ওয়েল্ডিং ও রিগিং দল", "वेल्डिंग और रिगिंग दल"],
  ["Helpers and material", "হেল্পার ও মাল বহন", "हेल्पर और माल ढुलाई"],

  // ── How we work ──
  ["How we deploy your", "যেভাবে আমরা পাঠাই আপনার", "ऐसे तैनात होती है आपकी"],
  ["crew", "ক্রু", "क्रू"],
  [
    "A four-step process built for speed, safety and paperwork you can show an inspector.",
    "চার ধাপের প্রক্রিয়া — দ্রুত, নিরাপদ, আর পরিদর্শককে দেখানোর মতো কাগজপত্র।",
    "चार चरणों की प्रक्रिया — तेज़, सुरक्षित और इंस्पेक्टर को दिखाने लायक कागज़ात।",
  ],
  ["Share your requirement", "আপনার চাহিদা জানান", "अपनी ज़रूरत बताएँ"],
  [
    "Reach us by call, WhatsApp or the form, and tell us what the site needs.",
    "কল, WhatsApp বা ফর্মে যোগাযোগ করে সাইটের প্রয়োজন জানান।",
    "कॉल, WhatsApp या फ़ॉर्म से संपर्क कर साइट की ज़रूरत बताएँ।",
  ],
  ["You send", "আপনি পাঠান", "आप भेजें"],
  [
    "Trades, headcount, site location, start date and shift pattern",
    "কাজের ধরন, লোকসংখ্যা, সাইটের ঠিকানা, শুরুর তারিখ ও শিফট",
    "काम का प्रकार, संख्या, साइट का पता, शुरू की तारीख़ और शिफ्ट",
  ],
  ["Site visit and crew plan", "সাইট পরিদর্শন ও ক্রু পরিকল্পনা", "साइट विज़िट और क्रू योजना"],
  [
    "We inspect the site and note its safety needs before planning the crew.",
    "ক্রু পরিকল্পনার আগে আমরা সাইট পরিদর্শন করে নিরাপত্তার প্রয়োজন নোট করি।",
    "क्रू की योजना से पहले हम साइट देखकर उसकी सुरक्षा ज़रूरतें दर्ज करते हैं।",
  ],
  ["You approve", "আপনি অনুমোদন করেন", "आप मंज़ूरी दें"],
  ["A written crew plan with rates", "রেট সহ লিখিত ক্রু পরিকল্পনা", "दरों सहित लिखित क्रू योजना"],
  ["Crew on site", "সাইটে ক্রু", "साइट पर क्रू"],
  [
    "Workers arrive inducted and in PPE, and attendance is recorded from day one.",
    "শ্রমিকরা ইনডাকশন শেষে PPE পরে আসেন, প্রথম দিন থেকেই হাজিরা রাখা হয়।",
    "श्रमिक इंडक्शन के बाद PPE में पहुँचते हैं, और पहले दिन से हाज़िरी दर्ज होती है।",
  ],
  ["On site", "সাইটে", "साइट पर"],
  ["An ID-checked crew with a JMT supervisor", "JMT সুপারভাইজার সহ পরিচয়-যাচাই করা ক্রু", "JMT सुपरवाइज़र के साथ पहचान-जाँची क्रू"],
  ["Monthly records and support", "মাসিক রেকর্ড ও সহায়তা", "मासिक रिकॉर्ड और सहायता"],
  [
    "You get your records every month, and workers who don’t suit the site are replaced.",
    "প্রতি মাসে রেকর্ড পান, আর সাইটে না মানালে শ্রমিক বদলে দেওয়া হয়।",
    "हर महीने रिकॉर्ड मिलते हैं, और साइट के अनुकूल न हों तो श्रमिक बदले जाते हैं।",
  ],
  ["Every month", "প্রতি মাসে", "हर महीने"],
  ["Wage register, attendance and PF/ESIC challans", "মজুরি রেজিস্টার, হাজিরা ও PF/ESIC চালান", "वेतन रजिस्टर, हाज़िरी और PF/ESIC चालान"],

  // ── Founder ──
  ["Founder and Director", "প্রতিষ্ঠাতা ও ডিরেক্টর", "संस्थापक और निदेशक"],
  ["You talk to the owner, not a call centre.", "কল সেন্টার নয়, সরাসরি মালিকের সঙ্গে কথা।", "कॉल सेंटर नहीं, सीधे मालिक से बात।"],
  [
    "I started Joy Maa Tara Bama Kripa to run labour supply the way contractors need it: one person accountable, crews that turn up as planned, and paperwork ready before anyone asks for it. Every enquiry comes to me directly. I visit your site, agree the crew plan with you, and stay your single point of contact for as long as we work together.",
    "ঠিকাদারদের যেমন দরকার, সেভাবেই শ্রমিক সরবরাহ চালাতে আমি Joy Maa Tara Bama Kripa শুরু করি: একজন দায়িত্বশীল মানুষ, পরিকল্পনামতো হাজির ক্রু, আর চাওয়ার আগেই তৈরি কাগজপত্র। প্রতিটি অনুসন্ধান সরাসরি আমার কাছে আসে। আমি আপনার সাইটে যাই, আপনার সঙ্গে ক্রু পরিকল্পনা ঠিক করি, আর যতদিন একসঙ্গে কাজ করি ততদিন আমিই আপনার একমাত্র যোগাযোগ।",
    "मैंने Joy Maa Tara Bama Kripa इसलिए शुरू किया ताकि श्रमिक आपूर्ति वैसे चले जैसे ठेकेदारों को चाहिए: एक ज़िम्मेदार व्यक्ति, योजना के अनुसार पहुँचने वाली क्रू, और माँगने से पहले तैयार कागज़ात। हर पूछताछ सीधे मेरे पास आती है। मैं आपकी साइट पर आता हूँ, आपके साथ क्रू योजना तय करता हूँ, और जब तक हम साथ काम करते हैं, मैं ही आपका एकमात्र संपर्क रहता हूँ।",
  ],
  ["Site induction", "সাইট ইনডাকশন", "साइट इंडक्शन"],
  ["PPE logged", "PPE নথিভুক্ত", "PPE दर्ज"],
  ["ID verified", "পরিচয় যাচাই", "पहचान सत्यापित"],
  ["Minimum wages", "ন্যূনতম মজুরি", "न्यूनतम मज़दूरी"],
  ["PF and ESIC monthly", "প্রতি মাসে PF ও ESIC", "हर महीने PF और ESIC"],
  ["Attendance kept", "হাজিরার রেকর্ড", "हाज़िरी का रिकॉर्ड"],

  // ── Banner ──
  ["A Strong Workforce for the stronger India", "শক্তিশালী ভারতের জন্য শক্তিশালী শ্রমশক্তি", "मज़बूत भारत के लिए मज़बूत कार्यबल"],
  ["Dedicated crew to power your Project", "আপনার প্রকল্পের জন্য নিবেদিত ক্রু", "आपके प्रोजेक्ट के लिए समर्पित क्रू"],
  ["Our Team", "আমাদের টিম", "हमारी टीम"],

  // ── FAQ ──
  ["Frequently asked questions", "সাধারণ প্রশ্নোত্তর", "अक्सर पूछे जाने वाले सवाल"],
  [
    "Straight answers on crews, rates, pay and paperwork.",
    "ক্রু, রেট, মজুরি ও কাগজপত্র নিয়ে সোজা উত্তর।",
    "क्रू, दरों, वेतन और कागज़ात पर सीधे जवाब।",
  ],
  ["Founder · answers calls himself", "প্রতিষ্ঠাতা · নিজেই ফোন ধরেন", "संस्थापक · ख़ुद कॉल उठाते हैं"],
  ["Still not sure? Talk to the owner.", "এখনও নিশ্চিত নন? মালিকের সঙ্গে কথা বলুন।", "अब भी संदेह है? मालिक से बात करें।"],
  [
    "Crew size, rates or timing. Get a straight answer before you send a request.",
    "ক্রুর আকার, রেট বা সময় — অনুরোধ পাঠানোর আগেই সোজা উত্তর পান।",
    "क्रू का आकार, दरें या समय — अनुरोध भेजने से पहले सीधा जवाब पाएँ।",
  ],
  ["Can't find your answer?", "উত্তর খুঁজে পাচ্ছেন না?", "जवाब नहीं मिला?"],
  ["Ask in the request form", "অনুরোধ ফর্মে জিজ্ঞাসা করুন", "अनुरोध फ़ॉर्म में पूछें"],
  ["For companies", "কোম্পানির জন্য", "कंपनियों के लिए"],
  ["For workers", "শ্রমিকদের জন্য", "श्रमिकों के लिए"],
  ["What's the minimum crew size?", "ন্যূনতম কতজনের ক্রু?", "न्यूनतम क्रू कितनी होती है?"],
  [
    "Usually a crew of [5] or more. For smaller needs, call us and we will tell you straight.",
    "সাধারণত [৫] জন বা তার বেশি। কম লোক লাগলে ফোন করুন, আমরা সোজাসুজি জানিয়ে দেব।",
    "आमतौर पर [5] या ज़्यादा लोगों की क्रू। कम ज़रूरत हो तो कॉल करें, हम साफ़-साफ़ बता देंगे।",
  ],
  ["Which areas do you serve?", "কোন কোন এলাকায় কাজ করেন?", "आप किन इलाक़ों में काम करते हैं?"],
  [
    "We are based in West Bengal and staff sites across [West Bengal and neighbouring states]. Share your site location and we will confirm before you commit.",
    "আমরা পশ্চিমবঙ্গে অবস্থিত এবং [পশ্চিমবঙ্গ ও পার্শ্ববর্তী রাজ্যে] সাইটে শ্রমিক দিই। সাইটের ঠিকানা জানান, চূড়ান্ত করার আগেই আমরা নিশ্চিত করব।",
    "हम पश्चिम बंगाल में हैं और [पश्चिम बंगाल व पड़ोसी राज्यों] में साइटों पर श्रमिक देते हैं। साइट का पता बताएँ, पक्का करने से पहले हम पुष्टि कर देंगे।",
  ],
  ["How fast can you deploy?", "কত দ্রুত শ্রমিক পাঠাতে পারেন?", "कितनी जल्दी तैनाती कर सकते हैं?"],
  [
    "Once you approve the crew plan, standard trades are usually on site within [7 days]. Larger or specialised crews take longer, and we give you the date up front.",
    "ক্রু পরিকল্পনা অনুমোদনের পর সাধারণ কাজের শ্রমিক সাধারণত [৭ দিনের] মধ্যে সাইটে পৌঁছায়। বড় বা বিশেষ ক্রুতে বেশি সময় লাগে, তারিখ আমরা আগেই জানিয়ে দিই।",
    "क्रू योजना मंज़ूर होने के बाद सामान्य काम के श्रमिक आमतौर पर [7 दिनों] में साइट पर पहुँच जाते हैं। बड़ी या विशेष क्रू में ज़्यादा समय लगता है, और तारीख़ हम पहले ही बता देते हैं।",
  ],
  ["How are rates worked out?", "রেট কীভাবে ঠিক হয়?", "दरें कैसे तय होती हैं?"],
  [
    "Rates depend on the trade, skill level, headcount, shift pattern and site location. After the site visit you get a written crew plan with rates before anyone is deployed.",
    "রেট নির্ভর করে কাজের ধরন, দক্ষতা, লোকসংখ্যা, শিফট ও সাইটের ঠিকানার উপর। সাইট পরিদর্শনের পর, কাউকে পাঠানোর আগেই রেট সহ লিখিত ক্রু পরিকল্পনা পাবেন।",
    "दरें काम के प्रकार, कौशल स्तर, संख्या, शिफ्ट और साइट के पते पर निर्भर करती हैं। साइट विज़िट के बाद, किसी को भेजने से पहले आपको दरों सहित लिखित क्रू योजना मिलती है।",
  ],
  ["Who supervises the crew?", "ক্রু-র তত্ত্বাবধান কে করেন?", "क्रू की निगरानी कौन करता है?"],
  [
    "Every crew comes with our own JMT supervisor on site, who handles attendance, discipline and day-to-day coordination with your site engineer.",
    "প্রতিটি ক্রু-র সঙ্গে সাইটে আমাদের নিজস্ব JMT সুপারভাইজার থাকেন, যিনি হাজিরা, শৃঙ্খলা ও আপনার সাইট ইঞ্জিনিয়ারের সঙ্গে দৈনন্দিন সমন্বয় সামলান।",
    "हर क्रू के साथ साइट पर हमारा अपना JMT सुपरवाइज़र रहता है, जो हाज़िरी, अनुशासन और आपके साइट इंजीनियर के साथ रोज़ का तालमेल सँभालता है।",
  ],
  ["What documents do we get?", "আমরা কী কী নথি পাব?", "हमें कौन-से दस्तावेज़ मिलते हैं?"],
  [
    "Every month you receive the wage register, attendance records and PF/ESIC challans, plus licence copies, ready for your auditor.",
    "প্রতি মাসে মজুরি রেজিস্টার, হাজিরার রেকর্ড ও PF/ESIC চালান, সঙ্গে লাইসেন্সের কপি — আপনার অডিটরের জন্য প্রস্তুত।",
    "हर महीने वेतन रजिस्टर, हाज़िरी रिकॉर्ड और PF/ESIC चालान, साथ में लाइसेंस की प्रतियाँ — आपके ऑडिटर के लिए तैयार।",
  ],
  ["How do I join a crew?", "কীভাবে ক্রু-তে যোগ দেব?", "मैं क्रू से कैसे जुड़ूँ?"],
  [
    "Call or WhatsApp us with your trade and experience. We check your ID, complete a site induction and place you with the next suitable crew.",
    "আপনার কাজ ও অভিজ্ঞতা জানিয়ে আমাদের কল বা WhatsApp করুন। আমরা পরিচয় যাচাই করি, সাইট ইনডাকশন করাই এবং পরের উপযুক্ত ক্রু-তে কাজ দিই।",
    "अपना काम और अनुभव बताकर हमें कॉल या WhatsApp करें। हम आपकी पहचान जाँचते हैं, साइट इंडक्शन कराते हैं और अगली उपयुक्त क्रू में काम देते हैं।",
  ],
  ["Will I get PF and ESIC?", "আমি কি PF ও ESIC পাব?", "क्या मुझे PF और ESIC मिलेगा?"],
  [
    "Yes. Registered workers are paid at least minimum wages, and PF and ESIC are deposited every month.",
    "হ্যাঁ। নথিভুক্ত শ্রমিকরা অন্তত ন্যূনতম মজুরি পান, এবং প্রতি মাসে PF ও ESIC জমা হয়।",
    "हाँ। पंजीकृत श्रमिकों को कम से कम न्यूनतम मज़दूरी मिलती है, और हर महीने PF व ESIC जमा होता है।",
  ],
  ["Do I need my own safety gear?", "নিজের সুরক্ষা সরঞ্জাম লাগবে?", "क्या अपना सुरक्षा सामान लाना होगा?"],
  [
    "No. You are issued PPE before going on site, and it is logged during your induction.",
    "না। সাইটে যাওয়ার আগে আপনাকে PPE দেওয়া হয়, এবং ইনডাকশনের সময় তা নথিভুক্ত হয়।",
    "नहीं। साइट पर जाने से पहले आपको PPE दिया जाता है, और इंडक्शन के दौरान यह दर्ज होता है।",
  ],

  // ── Contact and lead form ──
  ["Need a crew next week? Let's plan it today.", "আগামী সপ্তাহে ক্রু চাই? আজই পরিকল্পনা করি।", "अगले हफ़्ते क्रू चाहिए? आज ही योजना बनाएँ।"],
  ["Ready to build your crew?", "ক্রু তৈরি করতে প্রস্তুত?", "अपनी क्रू बनाने को तैयार?"],
  ["Send the site details. The owner calls you back.", "সাইটের বিবরণ পাঠান। মালিক নিজে ফোন করবেন।", "साइट का ब्योरा भेजें। मालिक ख़ुद कॉल करेंगे।"],
  ["Chat with us", "চ্যাট করুন", "चैट करें"],
  ["Reply time", "উত্তরের সময়", "जवाब का समय"],
  ["Send us your requirement", "আপনার চাহিদা পাঠান", "अपनी ज़रूरत भेजें"],
  [
    "Fill in the details and we will get back to you within 24 hours.",
    "বিবরণ দিন, ২৪ ঘণ্টার মধ্যে আমরা যোগাযোগ করব।",
    "ब्योरा भरें, हम 24 घंटे में संपर्क करेंगे।",
  ],
  ["Company name", "কোম্পানির নাম", "कंपनी का नाम"],
  ["Your name", "আপনার নাম", "आपका नाम"],
  ["Phone / WhatsApp", "ফোন / WhatsApp", "फ़ोन / WhatsApp"],
  ["Email", "ইমেল", "ईमेल"],
  ["Site location", "সাইটের ঠিকানা", "साइट का पता"],
  ["Headcount", "লোকসংখ্যা", "श्रमिकों की संख्या"],
  ["Start date", "শুরুর তারিখ", "शुरू की तारीख़"],
  ["(optional)", "(ঐচ্ছিক)", "(वैकल्पिक)"],
  ["Sending…", "পাঠানো হচ্ছে…", "भेजा जा रहा है…"],
  ["Request received", "অনুরোধ পেয়েছি", "अनुरोध मिल गया"],
  [
    "Thanks — your requirement is in. The owner will call you back within 24 hours.",
    "ধন্যবাদ — আপনার চাহিদা পেয়েছি। ২৪ ঘণ্টার মধ্যে মালিক নিজে ফোন করবেন।",
    "धन्यवाद — आपकी ज़रूरत हमें मिल गई। मालिक 24 घंटे में ख़ुद कॉल करेंगे।",
  ],
  ["Send another request", "আরেকটি অনুরোধ পাঠান", "एक और अनुरोध भेजें"],
  ["Please check the highlighted fields.", "চিহ্নিত ঘরগুলি দেখে নিন।", "कृपया चिह्नित फ़ील्ड जाँचें।"],
  [
    "We couldn't send your request just now. Please try again, or call or WhatsApp us directly.",
    "এই মুহূর্তে অনুরোধ পাঠানো গেল না। আবার চেষ্টা করুন, বা সরাসরি কল বা WhatsApp করুন।",
    "अभी अनुरोध नहीं भेजा जा सका। दोबारा कोशिश करें, या सीधे कॉल या WhatsApp करें।",
  ],
];

/** English text → built-in translation, per language. */
export const SEED_TRANSLATIONS: Record<"bn" | "hi", Readonly<Record<string, string>>> = {
  bn: Object.fromEntries(ROWS.map(([en, bn]) => [en, bn])),
  hi: Object.fromEntries(ROWS.map(([en, , hi]) => [en, hi])),
};
