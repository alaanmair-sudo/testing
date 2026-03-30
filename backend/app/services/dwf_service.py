import logging
from pathlib import Path

logger = logging.getLogger(__name__)


def convert_dwf_to_pdf(dwf_path: str, output_path: str) -> str:
    """Convert a DWF (Design Web Format) file to PDF using aspose.cad.

    Args:
        dwf_path: Path to the source DWF file.
        output_path: Path where the output PDF should be saved.

    Returns:
        The output path of the generated PDF.

    Raises:
        RuntimeError: If conversion fails.
    """
    source = Path(dwf_path)
    if not source.exists():
        raise FileNotFoundError(f"DWF file not found: {dwf_path}")

    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)

    try:
        import aspose.cad as cad
        from aspose.cad.imageoptions import PdfOptions

        image = cad.Image.load(str(source))
        pdf_options = PdfOptions()
        image.save(str(output), pdf_options)
        logger.info("Successfully converted DWF to PDF: %s -> %s", dwf_path, output_path)
        return str(output)

    except ImportError:
        logger.warning(
            "aspose.cad is not installed. Attempting fallback conversion for DWF file: %s",
            dwf_path,
        )
        try:
            import subprocess

            result = subprocess.run(
                ["libreoffice", "--headless", "--convert-to", "pdf", "--outdir",
                 str(output.parent), str(source)],
                capture_output=True,
                text=True,
                timeout=120,
            )
            if result.returncode == 0:
                converted = output.parent / f"{source.stem}.pdf"
                if converted.exists() and str(converted) != str(output):
                    converted.rename(output)
                logger.info("Fallback conversion succeeded: %s -> %s", dwf_path, output_path)
                return str(output)
            else:
                raise RuntimeError(
                    f"LibreOffice conversion failed: {result.stderr}"
                )
        except FileNotFoundError:
            raise RuntimeError(
                "Neither aspose.cad nor LibreOffice is available for DWF conversion. "
                "Install aspose.cad (pip install aspose-cad) or LibreOffice."
            )
        except subprocess.TimeoutExpired:
            raise RuntimeError("DWF to PDF conversion timed out after 120 seconds")

    except Exception as e:
        logger.error("Failed to convert DWF to PDF: %s", e)
        raise RuntimeError(f"DWF to PDF conversion failed: {e}") from e
