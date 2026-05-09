from pathlib import Path

from backend.proof.models import LossReportResponse

REPORTS_DIR = Path("reports")


def generate_loss_report_pdf(report: LossReportResponse, lat: float, lon: float) -> Path:
    REPORTS_DIR.mkdir(exist_ok=True)
    path = REPORTS_DIR / f"{report.report_id}.pdf"
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.pdfgen import canvas

        doc = canvas.Canvas(str(path), pagesize=A4)
        doc.setTitle(report.report_id)
        doc.drawString(72, 790, "FloodGuard Vietnam Loss Evidence Package")
        doc.drawString(72, 760, f"Report ID: {report.report_id}")
        doc.drawString(72, 740, f"Farmer: {report.farmer_name}")
        doc.drawString(72, 720, f"Field ID: {report.field_id}")
        doc.drawString(72, 700, f"GPS: {lat:.5f}, {lon:.5f}")
        doc.drawString(72, 680, f"Compensation: {report.compensation.compensation_million_vnd} million VND")
        doc.drawString(72, 660, f"Evidence completeness: {report.evidence_completeness_pct}%")
        doc.showPage()
        doc.drawString(72, 790, "Photo gallery")
        y = 760
        for photo in report.photo_metadata:
            doc.drawString(72, y, f"{photo.photo_type}: {photo.filename} ({photo.gps_source} GPS)")
            y -= 20
        doc.showPage()
        doc.drawString(72, 790, "Required DARD documents")
        y = 760
        for item in report.required_documents:
            doc.drawString(72, y, f"- {item}")
            y -= 20
        doc.save()
    except ImportError:
        path.write_bytes(
            b"%PDF-1.4\n"
            b"1 0 obj<<>>endobj\n"
            b"trailer<<>>\n"
            b"%%EOF\n"
        )
    return path
