type Props = {
  visible: boolean;
};

/*
 * RC1 VENTURE READY
 *
 * La capa Qhapaq Ñan queda temporalmente deshabilitada
 * mientras se recorta y simplifica el GeoJSON para móvil.
 *
 * No cargar, importar ni procesar el archivo actual:
 * su cantidad de geometrías puede bloquear el hilo principal
 * en dispositivos Android.
 */
function QhapaqNanLayer({
  visible,
}: Props) {
  if (visible) {
    console.warn(
      "Qhapaq Ñan está temporalmente deshabilitado en RC1 por optimización móvil."
    );
  }

  return null;
}

export default QhapaqNanLayer;