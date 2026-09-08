/**
 * Formats a date into a full Spanish text string.
 * Example output: "Lunes 1 de Enero de 2026"
 * 
 * @param {string|Date} dateInput 
 * @returns {string} Formatted date string
 */
function formatSpanishFullDate(dateInput) {
  if (!dateInput) return 'Fecha por confirmar';
  try {
    let date;
    if (typeof dateInput === 'string') {
      const cleanStr = dateInput.split('T')[0];
      const parts = cleanStr.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        date = new Date(year, month, day);
      } else {
        date = new Date(dateInput);
      }
    } else {
      date = new Date(dateInput);
    }

    if (isNaN(date.getTime())) return String(dateInput);

    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const dayName = dayNames[date.getDay()];
    const dayNum = date.getDate();
    const monthName = monthNames[date.getMonth()];
    const yearNum = date.getFullYear();

    return `${dayName} ${dayNum} de ${monthName} de ${yearNum}`;
  } catch (e) {
    return String(dateInput);
  }
}

module.exports = { formatSpanishFullDate };
