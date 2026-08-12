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
  }
}
```

Hii inaruhusu kila mtu kuona bidhaa, lakini kuongeza/kufuta bidhaa kunahitaji mtu kuingia (login) na anaweza kufuta bidhaa zake mwenyewe tu.

## Hatua 4 — Wezesha Storage (kwa picha za bidhaa)
1. Build → Storage → Get started
2. Weka rules zifuatazo:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /products/{uid}/{fileName} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == uid
                   && request.resource.size < 5 * 1024 * 1024;
    }
  }
}
```

Hii inaruhusu kila mtu kuona picha, lakini kupakia picha kunahitaji mtu kuingia na kupakia kwenye folda yake mwenyewe (`products/{uid ya mtumiaji}/`).

## Hatua 5 — Sanidi domain zilizoruhusiwa
Authentication → Settings → Authorized domains → ongeza domain utakayotumia kuhifadhi tovuti (mfano `hermansade3-cmd.github.io`).

## Muhtasari wa jinsi mfumo unavyofanya kazi
- Mtu yeyote anafungua `index.html` na kuona bidhaa zote — hahitaji akaunti.
- Akitaka **kuposti bidhaa**, anaelekezwa `login.html` kuingia au kujisajili (barua pepe au Google).
- Akiisha ingia, anaweza kuposti bidhaa (jina, bei, maelezo, picha, namba yake ya WhatsApp).
- Bidhaa zote zinaonekana papo hapo kwa kila mtu (real-time) kupitia Firestore.
- Kila muuzaji anaona alama "Yako" kwenye bidhaa zake na anaweza kuzifuta.
- Wanunuzi wanabonyeza "Nunua Sasa" na inafungua WhatsApp ya muuzaji husika moja kwa moja.
