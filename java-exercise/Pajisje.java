public class Pajisje {
    private String emri;
    private String prodhuesi;
    private double voltazhi;

    public Pajisje(String emri, String prodhuesi, double voltazhi) {
        this.emri = emri;
        this.prodhuesi = prodhuesi;
        this.voltazhi = voltazhi;
    }

    public String getEmri() {
        return emri;
    }

    public String getProdhuesi() {
        return prodhuesi;
    }

    public double getVoltazhi() {
        return voltazhi;
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (!(obj instanceof Pajisje)) return false;
        Pajisje p = (Pajisje) obj;
        return emri.equals(p.emri)
                && prodhuesi.equals(p.prodhuesi)
                && Double.compare(voltazhi, p.voltazhi) == 0;
    }

    @Override
    public String toString() {
        return "Pajisje{ emri='" + emri + "', prodhuesi='" + prodhuesi + "', voltazhi=" + voltazhi + "V }";
    }
}
