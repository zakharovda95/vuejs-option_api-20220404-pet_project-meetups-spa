import { getFirebaseData } from '@/requesters/firebase/_firebase.database.requesters';
import { createIconsList } from '@/requesters/firebase/_firebase.storage.requesters';
import moment from 'moment';
import 'moment/locale/ru';
import {
  filterMeetupsByInput,
  sortMeetupsByDate,
} from '@/services/_sorting.service';
import { getEventsDates } from '@/services/_events-dates.service';
import { onAuthStateChanged } from 'firebase/auth';
import { fbAuth, fbDb } from '@/requesters/firebase/_options.firebase';
import { logout } from '@/requesters/firebase/_firebase.auth.requesters';
import { ref, onValue } from 'firebase/database';

moment.locale('ru');

export const moduleMain = {
  state: () => ({
    userInfo: null,
    isLoading: false,
    mainPageIcons: [],
    meetups: [],
    //users: [],
    inputValue: '',
    meetupId: '',
    meetupSortParam: 'all',
  }),
  getters: {
    eventsDates(state) {
      return getEventsDates(state.meetups);
    },
    filteredMeetups(state, getters) {
      return filterMeetupsByInput(getters.sortedMeetups, state.inputValue);
    },
    sortedMeetups(state) {
      return sortMeetupsByDate(state.meetups, state.meetupSortParam);
    },
    meetup(state) {
      return state.meetups.find(item => item.id === state.meetupId);
    },
  },
  mutations: {
    chooseMeetupById(state, payload) {
      state.meetupId = payload;
    },
    checkLoading(state, payload) {
      state.isLoading = payload;
    },
    setMeetups(state, payload) {
      payload.forEach(item => {
        item.dateUnix = moment(item.date).valueOf();
        item.date = moment(item.date).format('DD MMMM yy г.');
      });
      state.meetups = payload;
    },
    setMainPageIcons(state, payload) {
      state.mainPageIcons.push(payload);
    },
    updateInputValue(state, payload) {
      state.inputValue = payload;
    },
    updateRadioValue(state, payload) {
      state.meetupSortParam = payload;
    },
    async setUserInfo(state, payload) {
      state.userInfo = await getFirebaseData('users/' + payload.uid);
    },
    clearUserInfo(state) {
      state.userInfo = null;
    },
  },
  actions: {
    setMeetupById({ commit }, payload) {
      commit('chooseMeetupById', payload);
    },
    getMeetups({ commit }) {
      try {
        onValue(ref(fbDb, 'meetups'), snapshot => {
          const response = snapshot.val();
          const result = Object.values(response);
          commit('setMeetups', result);
        });
      } catch (error) {
        console.log(error);
      }
    },
    async getIconList({ commit }) {
      try {
        commit('checkLoading', true);
        await createIconsList(commit, 'icons/');
      } catch (err) {
        console.log(err);
      } finally {
        commit('checkLoading', false);
      }
    },
    updateInputValue({ commit }, payload) {
      commit('updateInputValue', payload);
    },
    updateRadioValue({ commit }, payload) {
      commit('updateRadioValue', payload);
    },
    setUserInfo({ commit }, payload) {
      commit('setUserInfo', payload);
    },
    checkUserStatus({ commit }) {
      onAuthStateChanged(fbAuth, async user => {
        if (user) {
          const data = await getFirebaseData('users/' + user.uid);
          commit('setUserInfo', data);
        } else {
          console.log('Вы не авторизованы');
        }
      });
    },
    async signOut({ commit }) {
      await logout();
      commit('clearUserInfo');
    },
  },
};
