(function () {
  window.AppIndexViews = window.AppIndexViews || {};

  window.AppIndexViews.QrLabelsView = {
    name: 'QrLabelsView',
    props: {
      loading: Boolean,
      message: { type: String, default: '' },
      messageType: { type: String, default: 'success' }
    },
    emits: ['print', 'feedback'],
    data() {
      return {
        form: {
          codigoQR: '',
          nombre: '',
          ubicacion: ''
        }
      };
    },
    methods: {
      showError(message) {
        this.$emit('feedback', { type: 'error', message });
      },
      clearFeedback() {
        this.$emit('feedback', { type: 'success', message: '' });
      },
      printLabel() {
        const codigoQR = String(this.form.codigoQR || '').trim();
        const nombre = String(this.form.nombre || '').trim();
        const ubicacion = String(this.form.ubicacion || '').trim();

        if (!codigoQR) {
          this.showError('Código QR inválido');
          return;
        }

        if (!nombre) {
          this.showError('Nombre inválido');
          return;
        }

        if (!ubicacion) {
          this.showError('Ubicacion inválida');
          return;
        }

        this.clearFeedback();
        this.$emit('print', { codigoQR, nombre, ubicacion });
      },
      resetForm() {
        this.form = {
          codigoQR: '',
          nombre: '',
          ubicacion: ''
        };
        this.clearFeedback();
      }
    },
    template: `
      <div class="view-panel">
        <div class="view-header">
          <h2>QR_Printer</h2>
          <p>Formulario Etipack para etiquetas QR</p>
        </div>

        <div class="form-wrapper">
          <div class="label-card">
            <h3 class="label-card-title">QR Printer Label</h3>

            <div class="form-grid-single">
              <div class="form-group">
                <label class="form-label">Código QR</label>
                <v-text-field v-model="form.codigoQR" density="comfortable" variant="outlined" hide-details="auto" @keyup.enter="printLabel" />
              </div>

              <div class="form-group">
                <label class="form-label">Nombre</label>
                <v-text-field v-model="form.nombre" density="comfortable" variant="outlined" hide-details="auto" @keyup.enter="printLabel" />
              </div>

              <div class="form-group">
                <label class="form-label">Ubicacion</label>
                <v-text-field v-model="form.ubicacion" density="comfortable" variant="outlined" hide-details="auto" @keyup.enter="printLabel" />
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
              <v-btn @click="printLabel" color="primary" class="action-btn" :disabled="loading">
                Enviar
              </v-btn>

              <v-btn variant="text" prepend-icon="mdi-broom" @click="resetForm">
                Limpiar
              </v-btn>
            </div>
          </div>
        </div>
      </div>
    `
  };
})();
