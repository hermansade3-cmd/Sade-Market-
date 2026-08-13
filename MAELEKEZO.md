# Maelekezo ya Usanidi — Duka Langu (Firebase)

Faili zote nne (`index.html`, `login.html`, `firebase-init.js`, `style.css`) zinahitaji kuwa **kwenye folda moja** na kupakiwa mahali kama GitHub Pages, Firebase Hosting, au seva yoyote — sio kufunguliwa moja kwa moja kutoka kwenye kompyuta (`file://`), kwa sababu Firebase Auth haifanyi kazi vizuri kwa njia hiyo.

## Hatua 1 — Wezesha njia za kuingia (Authentication)
1. Nenda kwenye [Firebase Console](https://console.firebase.google.com/) → mradi wako `world-technology-4d429`
2. Build → Authentication → Sign-in method
3. Wezesha **Email/Password**
4. Wezesha **Google** (weka barua pepe ya msaada)

## Hatua 2 — Tengeneza Firestore Database
1. Build → Firestore Database → Create database
2. Chagua **Production mode** (tutaweka rules chini)
3. Chagua eneo (region) lililo karibu, mfano `eur3` au `us-central`

## Hatua 3 — Weka Firestore Rules
Nenda Firestore → Rules, kisha bandika:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /products/{productId} {
      allow read: if true;
      allow create: if request.auth != null
                    && request.resource.data.ownerUid == request.auth.uid;
      allow delete: if request.auth != null
                    && resource.data.ownerUid == request.auth.uid;
      allow update: if false;
    }

    match /conversations/{convoId} {
      allow read: if request.auth != null
                  && request.auth.uid in resource.data.participants;
      allow create: if request.auth != null
                    && request.auth.uid in request.resource.data.participants;
      allow update: if request.auth != null
                    && request.auth.uid in resource.data.participants;

      match /messages/{messageId} {
        allow read: if request.auth != null
                    && request.auth.uid in get(/databases/$(database)/documents/conversations/$(convoId)).data.participants;
        allow create: if request.auth != null
                      && request.auth.uid in get(/databases/$(database)/documents/conversations/$(convoId)).data.participants
                      && request.resource.data.senderUid == request.auth.uid;
        allow update, delete: if false;
      }
    }
  }
}
```

Hii inaruhusu:
- Kila mtu kuona bidhaa; kuongeza/kufuta bidhaa kunahitaji kuingia
- Mazungumzo (`conversations`) na ujumbe (`messages`) ndani yake kuonekana/kuandikwa tu na washiriki wawili wa mazungumzo hayo (mnunuzi na muuzaji)

**Muhimu:** Firestore inaweza kukuomba "uunde composite index" mara ya kwanza mfumo wa Ujumbe unapotumika (kwa ajili ya kuorodhesha mazungumzo kwa `participants` + tarehe). Ukiona hitilafu kwenye Console ya browser yenye kiungo (link) cha "Create Index", bonyeza kiungo hicho kwenye kompyuta/simu ukiwa umeingia Firebase Console, subiri dakika chache index ijengwe, kisha jaribu tena.

## Hatua 4 — Picha za bidhaa (HAKUNA Storage inayohitajika)
Mfumo huu **hautumii tena Firebase Storage** (ambayo inahitaji Blaze plan/kadi ya benki).
Badala yake, picha ya bidhaa inabanwa (compressed) moja kwa moja kwenye kivinjari cha mtumiaji
(kupitia canvas ya JavaScript) hadi iwe ndogo (chini ya ~450KB), kisha inahifadhiwa moja kwa moja
ndani ya hati (document) ya Firestore kama maandishi ya base64. Hauitaji kufanya usanidi wowote
wa ziada kwa hili — inafanya kazi papo hapo na Firestore ya bure uliyounda kwenye Hatua ya 2.

Kumbuka: kwa sababu kikomo cha hati moja ya Firestore ni 1MB, picha zinabanwa kiotomatiki
kubaki chini ya kikomo hicho — hii inamaanisha picha zitakuwa na ubora wa wastani (siyo wa hali ya juu
sana ukizizoom), lakini zitaonekana vizuri kwenye simu.

## Hatua 5 — Sanidi domain zilizoruhusiwa
Authentication → Settings → Authorized domains → ongeza domain utakayotumia kuhifadhi tovuti (mfano `hermansade3-cmd.github.io`).

## Muhtasari wa jinsi mfumo unavyofanya kazi
- Mtu yeyote anafungua `index.html` na kuona bidhaa zote — hahitaji akaunti.
- Akitaka **kuposti bidhaa**, anaelekezwa `login.html` kuingia au kujisajili (barua pepe au Google).
- Akiisha ingia, anaweza kuposti bidhaa (jina, bei, maelezo, picha, namba yake ya WhatsApp).
- Bidhaa zote zinaonekana papo hapo kwa kila mtu (real-time) kupitia Firestore.
- Kila muuzaji anaona alama "Yako" kwenye bidhaa zake na anaweza kuzifuta.
- Wanunuzi wanabonyeza "Nunua Sasa" na inafungua WhatsApp ya muuzaji husika moja kwa moja.
- Wanunuzi wanaweza pia kubonyeza "✉️ Ujumbe" kwenye bidhaa yoyote (isipokuwa yao wenyewe) kutuma ujumbe wa maandishi kwa muuzaji **ndani ya tovuti yenyewe**, bila WhatsApp.
- Muuzaji anapokea ujumbe huo kwenye sehemu ya "Ujumbe" (bottom nav), na anaweza kujibu papo hapo — mazungumzo yanaonekana kwa wote wawili kwa wakati halisi (real-time), kama chati ndogo.
- Alama nyekundu (dot) kwenye "Ujumbe" inaonyesha kuna ujumbe mpya ambao bado haujasomwa.
