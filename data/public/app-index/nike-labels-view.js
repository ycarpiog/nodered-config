(function () {
  window.AppIndexViews = window.AppIndexViews || {};

  window.AppIndexViews.NikeLabelsView = {
    name: 'NikeLabelsView',
    props: {
      loading: Boolean,
      message: { type: String, default: '' },
      messageType: { type: String, default: 'success' }
    },
    emits: ['print', 'feedback'],
    data() {
      return {
        form: {
          codigo: '',
          cantidad: 1
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
        const codigo = String(this.form.codigo || '').trim();
        const cantidad = parseInt(this.form.cantidad, 10);

        if (!codigo) {
          this.showError('Código inválido');
          return;
        }

        if (isNaN(cantidad) || cantidad <= 0) {
          this.showError('Cantidad inválida');
          return;
        }

        this.clearFeedback();
        this.$emit('print', { codigo, cantidad });
      },
      resetForm() {
        this.form = {
          codigo: '',
          cantidad: 1
        };
        this.clearFeedback();
      }
    },
    template: `
      <div class="view-panel">
        <div class="view-header">
          <h2>Flash_Etiquetas</h2>
          <p>Formulario de etiquetas Barcode 128</p>
        </div>

        <div class="form-wrapper">
          <div class="label-card">
            <h3 class="label-card-title">Bar Code 128</h3>

            <div class="form-grid-single">
              <div class="form-group">
                <label class="form-label">Código</label>
                <v-text-field v-model="form.codigo" density="comfortable" variant="outlined"
                  placeholder="Ej: QS1080.25" hide-details @keyup.enter="printLabel" />
              </div>

              <div class="form-group">
                <label class="form-label">Cantidad</label>
                <v-text-field v-model.number="form.cantidad" type="number" min="1" step="1"
                  density="comfortable" variant="outlined" placeholder="1" hide-details
                  @keyup.enter="printLabel" />
              </div>
            </div>

            <div class="toolbar-row">
              <v-btn color="success" variant="flat" prepend-icon="mdi-printer" class="action-btn"
                :disabled="loading" @click="printLabel">
                Imprimir
              </v-btn>

              <v-btn variant="text" prepend-icon="mdi-broom" @click="resetForm">
                Limpiar
              </v-btn>
            </div>

            <div v-if="message" class="nike-feedback">
              <v-icon :color="messageType === 'error' ? 'error' : 'success'" size="18">
                {{ messageType === 'error' ? 'mdi-alert-circle' : 'mdi-check-circle' }}
              </v-icon>
              <span :class="messageType === 'error' ? 'text-error' : 'text-success'">
                {{ message }}
              </span>
            </div>
          </div>
        </div>
      </div>
    `
  };
})();
