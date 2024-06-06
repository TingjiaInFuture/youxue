const store = new Vuex.Store({
    state() {
      return {
        selectedItem: null
      }
    },
    mutations: {
      selectItem(state, item) {
        state.selectedItem = item;
      }
    }
  })
  export default store;