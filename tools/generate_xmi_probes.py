from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "xmi" / "probes"


def write(name: str, text: str) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / name
    path.write_text(text, encoding="utf-8")
    print(path)


def main() -> None:
    write(
        "probe-omg-uml251-single-class.xmi",
        """<?xml version="1.0" encoding="UTF-8"?>
<xmi:XMI xmlns:xmi="http://www.omg.org/spec/XMI/20131001"
         xmlns:uml="http://www.omg.org/spec/UML/20131001"
         xmi:version="2.5.1">
  <uml:Model xmi:id="m1" name="ProbeModel">
    <packagedElement xmi:type="uml:Class" xmi:id="c1" name="ProbeClass"/>
  </uml:Model>
</xmi:XMI>
""",
    )

    write(
        "probe-eclipse-uml2-single-class.xmi",
        """<?xml version="1.0" encoding="UTF-8"?>
<xmi:XMI xmi:version="2.1"
  xmlns:xmi="http://schema.omg.org/spec/XMI/2.1"
  xmlns:uml="http://www.eclipse.org/uml2/5.0.0/UML">
  <uml:Model xmi:id="m1" name="ProbeModel">
    <packagedElement xmi:type="uml:Class" xmi:id="c1" name="ProbeClass"/>
  </uml:Model>
</xmi:XMI>
""",
    )

    write(
        "probe-uml241-single-class.xmi",
        """<?xml version="1.0" encoding="UTF-8"?>
<xmi:XMI xmlns:xmi="http://www.omg.org/spec/XMI/20110701"
         xmlns:uml="http://www.omg.org/spec/UML/20110701"
         xmi:version="2.4.1">
  <uml:Model xmi:id="m1" name="ProbeModel">
    <packagedElement xmi:type="uml:Class" xmi:id="c1" name="ProbeClass"/>
  </uml:Model>
</xmi:XMI>
""",
    )

    write(
        "probe-usecase-uml251.xmi",
        """<?xml version="1.0" encoding="UTF-8"?>
<xmi:XMI xmlns:xmi="http://www.omg.org/spec/XMI/20131001"
         xmlns:uml="http://www.omg.org/spec/UML/20131001"
         xmi:version="2.5.1">
  <uml:Model xmi:id="m1" name="ProbeUseCaseModel">
    <packagedElement xmi:type="uml:Actor" xmi:id="a1" name="User"/>
    <packagedElement xmi:type="uml:UseCase" xmi:id="u1" name="UseSystem"/>
  </uml:Model>
</xmi:XMI>
""",
    )


if __name__ == "__main__":
    main()
