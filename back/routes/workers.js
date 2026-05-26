const express = require('express');
const router = express.Router();
const axios = require('axios');

// Proxy endpoint for external workers (ListadoTrabajadores)
router.get('/external/workers', async (req, res) => {
  const { id_cot, niv_id } = req.query;

  if (!id_cot || !niv_id) {
    return res.status(400).json({ error: 'Faltan parámetros id_cot o niv_id' });
  }

  console.log(`[PROXY] Consultando trabajadores externos para COT: ${id_cot}, NIV: ${niv_id}`);

  try {
    const response = await axios.post(process.env.EXTERNAL_WORKERS_API_URL, {
      cot_id: parseInt(id_cot, 10),
      niv_id: parseInt(niv_id, 10)
    }, {
      headers: {
        'api-key': process.env.API_KEY_TRABAJADORES,
        'Content-Type': 'application/json'
      }
    });

    console.log(`[PROXY] Respuesta de API externa recibida. Status: ${response.status}`);

    // La API puede devolver la lista directamente o en un campo. Manejamos ambos.
    const rawWorkers = Array.isArray(response.data) ? response.data : (response.data.trabajadores || []);
    console.log(`[PROXY] Procesados ${rawWorkers.length} trabajadores de la API externa.`);

    const workers = rawWorkers.map(w => ({
      ...w,
      id: w.id || w.rut || `ext-${Math.random().toString(36).substr(2, 9)}`,
      niv_id: parseInt(niv_id, 10) // Mantenemos niv_id internamente para el front
    }));

    res.json(workers);
  } catch (err) {
    console.error('[PROXY] Error fetching external workers:', err.message);
    if (err.response) {
      console.error('[PROXY] External API responded with error:', err.response.status, err.response.data);
      return res.status(err.response.status).json({ error: 'Error del servicio externo de trabajadores', details: err.response.data });
    } else if (err.request) {
      console.error('[PROXY] No response from external API:', err.request);
      return res.status(504).json({ error: 'No se pudo contactar el servicio externo de trabajadores (Gateway Timeout)' });
    }
    res.status(500).json({ error: 'Error interno al consultar API externa', details: err.message });
  }
});

module.exports = router;
