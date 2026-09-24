(function () {
  window.AppIndexViews = window.AppIndexViews || {};

  window.AppIndexViews.AbbotLabelsView = {
    name: 'AbbotLabelsView',
    props: {
      loading: Boolean,
      message: { type: String, default: '' },
      messageType: { type: String, default: 'success' }
    },
    emits: ['print', 'feedback'],
    data() {
      return {
        form: {
          code: '',
          msp: '',
          cant: ''
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
      esNumero(valor) {
        return valor !== '' && !isNaN(valor);
      },
      printLabel() {
        if (!this.form.code || !this.form.msp || !this.form.cant) {
          this.showError('Todos los campos son obligatorios.');
          return;
        }

        if (!this.esNumero(this.form.msp) || !this.esNumero(this.form.cant)) {
          this.showError('MSP y Cantidad deben ser números.');
          return;
        }

        this.clearFeedback();
        this.$emit('print', {
          code: String(this.form.code || '').trim(),
          msp: Number(this.form.msp),
          cant: Number(this.form.cant)
        });
      },
      resetForm() {
        this.form = {
          code: '',
          msp: '',
          cant: ''
        };
        this.clearFeedback();
      }
    },
    template: `
      <div class="view-panel">
        <div class="view-header">
          <h2>Abbot_Etiquetas</h2>
          <p>Formulario Etipack</p>
        </div>

        <div class="form-wrapper">
          <div class="label-card">
            <h3 class="label-card-title">Formulario Etipack</h3>

            <div class="form-grid-single">
              <div class="form-group">
                <label class="form-label">Código</label>
                <v-text-field v-model="form.code" label="Código" density="compact" variant="outlined"
                  hide-details="auto" @keyup.enter="printLabel" />
              </div>

              <div class="form-group">
                <label class="form-label">MSP</label>
                <v-text-field v-model="form.msp" label="MSP" type="number" density="compact"
                  variant="outlined" hide-details="auto" @keyup.enter="printLabel" />
              </div>

              <div class="form-group">
                <label class="form-label">Cantidad</label>
                <v-text-field v-model="form.cant" label="Cantidad" type="number" density="compact"
                  variant="outlined" hide-details="auto" @keyup.enter="printLabel" />
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
