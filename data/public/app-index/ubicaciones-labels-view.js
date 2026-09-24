(function () {
  window.AppIndexViews = window.AppIndexViews || {};

  window.AppIndexViews.UbicacionesLabelsView = {
    name: 'UbicacionesLabelsView',
    props: {
      loading: Boolean,
      rows: {
        type: Array,
        default: () => []
      },
      message: { type: String, default: '' },
      messageType: { type: String, default: 'success' }
    },
    emits: ['parse-file', 'print', 'reset', 'download-template', 'feedback'],
    data() {
      return {
        file: null
      };
    },
    methods: {
      showError(message) {
        this.$emit('feedback', { type: 'error', message });
      },
      clearFeedback() {
        this.$emit('feedback', { type: 'success', message: '' });
      },
      handleFile(value) {
        const file = Array.isArray(value) ? value[0] : value;
        this.clearFeedback();

        if (!file) return;

        const fileName = file.name || '';
        if (!/\.(xlsx|xls)$/i.test(fileName)) {
          this.file = null;
          this.showError('El archivo debe ser Excel (.xlsx o .xls).');
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          const result = String(reader.result || '');
          const base64 = result.includes(',') ? result.split(',').pop() : result;
          this.$emit('parse-file', { fileName, base64 });
        };
        reader.onerror = () => {
          this.showError('No fue posible leer el archivo.');
        };
        reader.readAsDataURL(file);
      },
      printLabels() {
        if (!this.rows.length) {
          this.showError('Carga un archivo con ubicaciones antes de imprimir.');
          return;
        }

        this.$emit('print', this.rows);
      },
      resetView() {
        this.file = null;
        this.clearFeedback();
        this.$emit('reset');
      }
    },
    template: `
      <div class="view-panel">
        <div class="view-header">
          <h2>Etiquetas Ubicaciones</h2>
          <p>Carga por Excel con columna UbiUbicacion</p>
        </div>

        <div class="form-wrapper wide-form-wrapper">
          <div class="label-card ubicaciones-card">
            <div class="section-header">
              <h3 class="label-card-title ubicaciones-title">Archivo de ubicaciones</h3>
              <v-btn variant="text" prepend-icon="mdi-file-download-outline" class="header-action-btn"
                :disabled="loading" @click="$emit('download-template')">
                Descargar plantilla
              </v-btn>
            </div>

            <div class="form-grid-single">
              <div class="form-group">
                <label class="form-label">Archivo Excel</label>
                <v-file-input v-model="file" accept=".xlsx,.xls" density="comfortable"
                  variant="outlined" prepend-icon="mdi-file-excel-outline" hide-details="auto"
                  @update:model-value="handleFile" />
              </div>
            </div>

            <div v-if="message" class="nike-feedback">
              <v-icon :color="messageType === 'error' ? 'error' : 'success'" size="18">
                {{ messageType === 'error' ? 'mdi-alert-circle' : 'mdi-check-circle' }}
              </v-icon>
              <span :class="messageType === 'error' ? 'text-error' : 'text-success'">
                {{ message }}
              </span>
            </div>

            <div class="toolbar-row">
              <v-btn color="success" variant="flat" prepend-icon="mdi-printer" class="action-btn"
                :disabled="!rows.length || loading" @click="printLabels">
                Imprimir
              </v-btn>

              <v-btn variant="text" prepend-icon="mdi-broom" @click="resetView">
                Limpiar
              </v-btn>
            </div>

            <div v-if="rows.length" class="locations-table-wrap">
              <table class="locations-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>UbiUbicacion</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in rows" :key="'ubi-' + row.index + '-' + row.ubiUbicacion">
                    <td>{{ row.index }}</td>
                    <td>{{ row.ubiUbicacion }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `
  };
})();
