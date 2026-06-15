public class Dyqani {

    // 1.2 - atributi readonly emri dhe varg per pajisjet
    private final String emri;
    private Pajisje[] pajisjet;
    private int numriPajisieve;

    // 1.2.1 - konstruktori: pranon emrin dhe numrin e pajisieve
    public Dyqani(String emri, int kapaciteti) {
        this.emri = emri;
        this.pajisjet = new Pajisje[kapaciteti];
        this.numriPajisieve = 0;
    }

    // 1.2.2 - ekziston: tregon nese pajisja gjendet ne dyqan
    public boolean ekziston(Pajisje pajisja) {
        for (int i = 0; i < numriPajisieve; i++) {
            if (pajisjet[i].equals(pajisja)) {
                return true;
            }
        }
        return false;
    }

    // 1.2.3 - shtoPajisjen: shton pajisjen nese nuk ekziston dhe ka vend
    public void shtoPajisjen(Pajisje pajisja) {
        if (!ekziston(pajisja) && numriPajisieve < pajisjet.length) {
            pajisjet[numriPajisieve] = pajisja;
            numriPajisieve++;
        }
    }

    // 1.2.4 - shtyPajisjetSipasProddhuesit: shtypë te gjitha pajisjet sipas prodhuesit
    public void shtyPajisjetSipasProddhuesit(String prodhuesi) {
        System.out.println("Pajisjet e prodhuesit '" + prodhuesi + "':");
        boolean gjetur = false;
        for (int i = 0; i < numriPajisieve; i++) {
            if (pajisjet[i].getProdhuesi().equalsIgnoreCase(prodhuesi)) {
                System.out.println("  " + pajisjet[i]);
                gjetur = true;
            }
        }
        if (!gjetur) {
            System.out.println("  Nuk ka pajisje nga ky prodhues.");
        }
    }

    // 1.2.5 - avgMaxVoltazhi: kthen pajisjen me voltazhin me te larte mbi mesataren
    //         nese ka te njejtin voltazh maksimal, kthehet e fundit
    public Pajisje avgMaxVoltazhi() {
        if (numriPajisieve == 0) return null;

        // llogarit mesataren
        double shuma = 0;
        for (int i = 0; i < numriPajisieve; i++) {
            shuma += pajisjet[i].getVoltazhi();
        }
        double mesatarja = shuma / numriPajisieve;

        // gjej pajisjen me voltazhin me te larte mbi mesatare (e fundit nese barazi)
        Pajisje rezultati = null;
        double maxVoltazhi = Double.MIN_VALUE;

        for (int i = 0; i < numriPajisieve; i++) {
            double v = pajisjet[i].getVoltazhi();
            if (v > mesatarja && v >= maxVoltazhi) {
                maxVoltazhi = v;
                rezultati = pajisjet[i];
            }
        }

        return rezultati;
    }

    // 1.2.6 & 1.2.7 - main: krijon instancen e Dyqanit "Neptun" dhe teston te gjitha metodat
    public static void main(String[] args) {

        // -- Krijoni instancen e Dyqanit --
        Dyqani dyqani = new Dyqani("Neptun", 10);

        // Shto pajisjet
        dyqani.shtoPajisjen(new Pajisje("Lavatriçe",    "Samsung", 220));
        dyqani.shtoPajisjen(new Pajisje("Frigorifer",   "LG",      240));
        dyqani.shtoPajisjen(new Pajisje("Televizor",    "Samsung", 110));
        dyqani.shtoPajisjen(new Pajisje("Kondicionere", "Midea",   380));
        dyqani.shtoPajisjen(new Pajisje("Aspirator",    "Philips", 230));

        System.out.println("===== Dyqani: " + dyqani.emri + " =====\n");

        // -- Test 1.2.2: ekziston --
        Pajisje p1 = new Pajisje("Lavatriçe", "Samsung", 220);
        Pajisje p2 = new Pajisje("Mikser",    "Tefal",   50);
        System.out.println("Test ekziston():");
        System.out.println("  Lavatriçe Samsung ekziston: " + dyqani.ekziston(p1));  // true
        System.out.println("  Mikser Tefal ekziston:      " + dyqani.ekziston(p2));  // false

        // -- Test 1.2.3: shtoPajisjen (tentim duplikat) --
        System.out.println("\nTest shtoPajisjen() me duplikat:");
        System.out.println("  Para shtimit: " + dyqani.numriPajisieve + " pajisje");
        dyqani.shtoPajisjen(new Pajisje("Lavatriçe", "Samsung", 220)); // duplikat, nuk shtohet
        System.out.println("  Pas tentimit: " + dyqani.numriPajisieve + " pajisje (s'ka ndryshuar)");

        // -- Test 1.2.4: shtyPajisjetSipasProddhuesit --
        System.out.println();
        dyqani.shtyPajisjetSipasProddhuesit("Samsung");
        System.out.println();
        dyqani.shtyPajisjetSipasProddhuesit("Bosch");   // nuk ekziston

        // -- Test 1.2.5: avgMaxVoltazhi --
        System.out.println("\nTest avgMaxVoltazhi():");
        Pajisje maks = dyqani.avgMaxVoltazhi();
        if (maks != null) {
            System.out.println("  Pajisja me voltazhin me te larte mbi mesatare: " + maks);
        } else {
            System.out.println("  Nuk ka pajisje mbi mesatare.");
        }
    }
}
