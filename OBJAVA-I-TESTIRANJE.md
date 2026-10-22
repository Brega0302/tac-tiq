# Objava i testiranje TAC - TIQ

## Šta je sačuvano

- Mapa TAC-TIQ na Desktopu sadrži cijeli izvorni kod, testove i upute.
- TAC-TIQ-izvorni-kod.zip: prenosiva kopija izvornog koda, bez node_modules i Git interne mape. Nakon raspakivanja: npm ci, pa npm run dev.
- TAC-TIQ-za-objavu.zip: samo završni web fajlovi. Raspakuj i objavi sadržaj na statički hosting. Ne pokreći index.html dvoklikom; koristi hosting ili npm run preview.
- Size-Wars-Original-2026-10-22 i stari Size-Wars-za-objavu.zip ostaju originalna samostalna verzija.

## Besplatni link za prijatelje: GitHub Pages

Repozitorij: https://github.com/Brega0302/tac-tiq
Objavljena i provjerena adresa: https://brega0302.github.io/tac-tiq/

GitHub Pages je već podešen na Settings > Pages > Source: GitHub Actions. Workflow u .github/workflows/deploy.yml pri svakom pushu na main instalira zavisnosti, pokreće testove, pravi build za /tac-tiq/ i objavljuje dist. Status objave vidi se pod Actions. Link radi i kada je tvoj računar ugašen.

GitHub Pages je dostupan besplatno za javne repozitorije. Ako objava još nije zelena, javni link možda još ne radi. Izvor: https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site
Vite podešavanja: https://vite.dev/guide/static-deploy.html

Alternativa: importuj repozitorij u Vercel, framework Vite, build npm run build, output dist. Nisu potrebne varijable okruženja. Provjeri aktuelne uslove odabranog hosting paketa prije komercijalne objave.

## Kako prikupiti korisne reakcije

Pošalji link grupi od 5–10 prijatelja koji imaju različite telefone i računare. Neka svako odigra sve tri igre, barem jednu protiv AI i jednu lokalno. Za svaku prijavu traži:

1. Uređaj i browser (npr. iPhone/Safari ili Android/Chrome).
2. Koju igru, broj igrača i težinu AI su izabrali.
3. Korake koji su doveli do problema i šta su očekivali.
4. Screenshot/video ako mogu, te ocjenu zabave 1–5.
5. Jesu li pravila jasna i žele li ponovo igrati.

Provjeriti male ekrane, okretanje telefona, zvuk i muziku, pobjede/remi, alternativni prvi potez AI, čuvanje/brisanje rezultata i engleski/bosanski. Prijatelji s GitHub računom mogu otvoriti Issue u repozitoriju. Ostali ti mogu poslati odgovor uz screenshot.

Ova verzija podržava AI ili više ljudi na istom uređaju. Online mečevi između različitih uređaja još nisu implementirani. Rezultati ostaju u tom browseru; nema korisničkih računa ni zajedničke rang-liste. Osvježavanje prekida aktivnu partiju. PWA instalacija i pouzdan offline režim još nisu dodani.

## Moj prijedlog sljedećih koraka

Prvo testiraj ovu web verziju. Popravi probleme koje ljudi zaista primijete. Zatim razmotri nastavak partije nakon osvježavanja, instalaciju na početni ekran/offline rad i mobilnu doradu. Online multiplayer je zaseban veći korak jer zahtijeva server, sobe, sinhronizaciju i obradu prekida veze.

## Ako želiš Google Play ili Apple App Store

Postojeći React kod može se iskoristiti u Capacitor projektu. On pakuje web build u Android/iOS aplikaciju. To tek treba implementirati; ovaj repozitorij trenutno sadrži web igricu, ne gotov AAB/IPA paket.

Plan: dodati Capacitor; odabrati trajni app ID; pripremiti ikone i splash; testirati dodir, safe-area, povratak, pozadinski zvuk i offline rad; napraviti potpisanu produkcijsku verziju; pripremiti opis, snimke ekrana, dobnu kategoriju, podršku i izjave o privatnosti prema stvarnom ponašanju aplikacije.

- Android: Android Studio, potpisani AAB, Play Console. Registracija je trenutno 25 USD jednokratno. Novi lični računi kreirani nakon 13.11.2023. moraju imati zatvoreni test s najmanje 12 testera prijavljenih neprekidno najmanje 14 dana, pa podnijeti zahtjev za produkcijski pristup. Obično web testiranje linkom nije taj Play Console zatvoreni test.
- iPhone: za standardni lokalni build potreban je Mac i Xcode (ili odgovarajući Mac build servis), Apple Developer članstvo trenutno 99 USD godišnje, App Store Connect i beta testiranje preko TestFlighta. Apple procjenjuje da aplikacija pruža dovoljan sadržaj i iskustvo; jednostavno pakovanje web stranice ne garantuje odobrenje.

Troškovi i pravila provjereni 22.10.2026; konačne lokalne cijene i uslove provjeri prilikom registracije. Nemoj dodavati reklame ili analitiku prije nego uskladiš izjave o prikupljanju podataka s onim što ti SDK-ovi stvarno rade.

Službene upute:
- Capacitor workflow: https://capacitorjs.com/docs/basics/workflow
- Google registracija: https://support.google.com/googleplay/android-developer/answer/6112435
- Google zatvoreni test: https://support.google.com/googleplay/android-developer/answer/14151465
- Apple članstvo: https://developer.apple.com/programs/whats-included/
- Apple pravilo 4.2: https://developer.apple.com/app-store/review/guidelines/#minimum-functionality

Javni repozitorij ne znači automatski da je kod pod MIT licencom. Licenca nije dodana; tu odluku možeš donijeti prije šire distribucije izvornog koda.

