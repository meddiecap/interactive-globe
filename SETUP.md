# Git setup — koppel lokale repo aan GitHub

De lokale repo heeft al een volledige commit history. De GitHub repo heeft een losse commit (LICENSE).
Deze stappen voegen de twee samen en pushen alles naar GitHub.

## Stap 1 — remote toevoegen en ophalen

```bash
git remote add origin https://github.com/meddiecap/interactive-country-globe.git
git fetch origin
```

## Stap 2 — histories samenvoegen

```bash
git merge origin/main --allow-unrelated-histories
```

> Je editor opent een merge-commit bericht. Sla op en sluit.

## Stap 3 — pushen

```bash
git branch -M main
git push -u origin main
```

---

Na stap 3 staat alles op GitHub. Je kunt `SETUP.md` daarna verwijderen als je wil.
