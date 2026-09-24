(function () {
  window.AppIndexViews = window.AppIndexViews || {};

  window.AppIndexViews.DashboardView = {
    name: 'DashboardView',
    props: {
      dashboard: {
        type: Object,
        default: () => ({
          docs: 0,
          audits: 0,
          kpis: 0,
          activities: []
        })
      }
    },
    emits: ['refresh', 'open-ubicaciones'],
    template: `
      <div class="view-panel">
        <div class="view-header">
          <h2>Dashboard</h2>
          <p>Resumen general del sistema</p>
        </div>

        <div class="cards-grid">
          <div class="info-card">
            <div class="info-card-title">Documentos activos</div>
            <div class="info-card-value">{{ dashboard.docs }}</div>
          </div>

          <div class="info-card">
            <div class="info-card-title">Auditorías pendientes</div>
            <div class="info-card-value">{{ dashboard.audits }}</div>
          </div>

          <div class="info-card">
            <div class="info-card-title">Indicadores</div>
            <div class="info-card-value">{{ dashboard.kpis }}</div>
          </div>
        </div>

        <div class="module-card mt-4">
          <div class="section-header">
            <h3>Actividad reciente</h3>
            <v-btn color="primary" variant="text" prepend-icon="mdi-refresh" class="header-action-btn"
              @click="$emit('refresh')">
              Actualizar
            </v-btn>
          </div>

          <div v-if="dashboard.activities.length">
            <div v-for="(item, i) in dashboard.activities" :key="'act-' + i" class="list-row">
              <v-icon size="18" color="primary">mdi-history</v-icon>
              <span>{{ item }}</span>
            </div>
          </div>

          <div v-else class="empty-text">Sin actividad reciente</div>
        </div>

        <div class="module-card mt-4">
          <div class="section-header">
            <h3>Etiquetas Ubicaciones</h3>
            <v-btn color="primary" variant="flat" prepend-icon="mdi-upload" class="header-action-btn"
              @click="$emit('open-ubicaciones')">
              Cargar Excel
            </v-btn>
          </div>
        </div>
      </div>
    `
  };
})();
