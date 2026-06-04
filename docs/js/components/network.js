// SmartLife SPA Network Component Module
import { AppState } from '../state.js';

let searchResult = null;

window.handleSearchFriend = async function (event) {
  event.preventDefault();
  const username = document.getElementById('friend-username-input').value.trim();
  if (!username) return;

  if (AppState.currentUser && username.toLowerCase() === AppState.currentUser.username.toLowerCase()) {
    import('../ui.js').then(ui => ui.showToast('ไม่สามารถส่งคำเชิญให้ตัวเองได้', 'warning'));
    return;
  }

  const fb = await import('../firebase.js');
  const usersQuery = fb.query(fb.collection(fb.db, 'users'), fb.where('username', '==', username.toLowerCase()));
  const userSnap = await fb.getDocs(usersQuery);

  if (userSnap.empty) {
    import('../ui.js').then(ui => ui.showToast('ไม่พบบัญชีผู้ใช้นี้', 'error'));
    searchResult = null;
  } else {
    searchResult = userSnap.docs[0].data();
  }

  import('../router.js').then(m => m.renderPage());
};

window.handleSendFriendRequest = async function () {
  if (searchResult) {
    const success = await AppState.sendFriendRequest(searchResult.username);
    if (success) {
      searchResult = null;
      import('../router.js').then(m => m.renderPage());
    }
  }
};

window.acceptRequest = function (reqId, uid, username) {
  AppState.acceptFriendRequest(reqId, uid, username).then(() => {
    import('../router.js').then(m => m.renderPage());
  });
};

window.rejectRequest = function (reqId) {
  AppState.rejectFriendRequest(reqId).then(() => {
    import('../router.js').then(m => m.renderPage());
  });
};

window.changeFriendRole = function (uid, role) {
  AppState.updateFriendRole(uid, role).then(() => {
    import('../router.js').then(m => m.renderPage());
  });
};

window.handleRemoveFriend = function (uid, username) {
  if (confirm(`คุณต้องการลบ @${username} ออกจากรายชื่อเพื่อนใช่หรือไม่?\n*เมื่อลบแล้วต่างฝ่ายจะไม่สามารถเห็นกันและกันได้อีก`)) {
    AppState.removeFriend(uid).then(() => {
      import('../router.js').then(m => m.renderPage());
    });
  }
};

export function renderNetworkComponent() {
  const requests = AppState.friendRequests || [];
  const friends = AppState.friends || [];

  return `
    <div class="space-y-6">
      <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <i data-lucide="users" class="text-[#007a7a]"></i>
            <span>จัดการเพื่อนและครอบครัว (Network)</span>
          </h1>
          <p class="text-slate-500 text-xs mt-1">เพิ่มเพื่อนและกำหนดสิทธิ์ให้ครอบครัวเข้าถึงปฏิทินของคุณได้</p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Add Friend Card -->
        <div class="glass-panel p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <h3 class="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
            <i data-lucide="search" class="w-5 h-5 text-[#007a7a]"></i> ค้นหาเพื่อนใหม่
          </h3>
          <form onsubmit="handleSearchFriend(event)" class="flex flex-col sm:flex-row gap-2">
            <input type="text" id="friend-username-input" required placeholder="ค้นหาด้วย Username..." value="${searchResult ? searchResult.username : ''}" class="glass-input flex-1 px-4 py-2.5 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#007a7a]/50 border border-slate-200">
            <button type="submit" class="w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-slate-800 hover:bg-slate-700 transition-all shadow-md shrink-0 flex items-center justify-center gap-1">
              <i data-lucide="search" class="w-4 h-4"></i> ค้นหา
            </button>
          </form>

          ${searchResult ? `
            <div class="mt-4 p-4 rounded-xl border border-teal-100 bg-teal-50/50 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-full bg-gradient-to-tr from-[#007a7a] to-teal-400 flex items-center justify-center font-bold text-white shadow-sm text-lg">
                  ${searchResult.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p class="font-bold text-slate-800">${searchResult.name || searchResult.username}</p>
                  <p class="text-xs text-slate-500">@${searchResult.username}</p>
                </div>
              </div>
              <button onclick="handleSendFriendRequest()" class="w-full sm:w-auto px-4 py-2 rounded-lg text-sm font-bold text-white bg-[#007a7a] hover:bg-[#006363] transition-all shadow-md flex items-center justify-center gap-1">
                <i data-lucide="user-plus" class="w-4 h-4"></i> ส่งคำเชิญ
              </button>
            </div>
          ` : ''}

          <div class="mt-6 border-t border-slate-200 pt-4">
            <h3 class="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
              <i data-lucide="bell" class="w-4 h-4 text-amber-500"></i> คำเชิญที่รอยืนยัน (${requests.length})
            </h3>
            ${requests.length === 0 ? `<p class="text-xs text-slate-500 italic">ไม่มีคำเชิญใหม่</p>` : `
              <div class="space-y-3 max-h-[300px] overflow-y-auto custom-scroll pr-2">
                ${requests.map(req => `
                  <div class="p-3 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-3">
                    <div class="min-w-0">
                      <p class="text-sm font-bold text-slate-800 truncate">@${req.fromUsername}</p>
                      <p class="text-[10px] text-slate-500">ต้องการเพิ่มคุณเป็นเพื่อน</p>
                    </div>
                    <div class="flex gap-1.5 shrink-0">
                      <button onclick="acceptRequest('${req.id}', '${req.fromUid}', '${req.fromUsername}')" class="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors border border-emerald-100" title="ยอมรับ">
                        <i data-lucide="check" class="w-4 h-4"></i>
                      </button>
                      <button onclick="rejectRequest('${req.id}')" class="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors border border-rose-100" title="ปฏิเสธ">
                        <i data-lucide="x" class="w-4 h-4"></i>
                      </button>
                    </div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>
        </div>

        <!-- Friend List Card -->
        <div class="glass-panel p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 class="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
            <i data-lucide="users" class="w-5 h-5 text-indigo-500"></i> รายชื่อเพื่อนของฉัน (${friends.length})
          </h3>
          
          ${friends.length === 0 ? `
            <div class="flex flex-col items-center justify-center py-10 text-center">
              <div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                <i data-lucide="user-x" class="w-8 h-8 text-slate-300"></i>
              </div>
              <p class="text-slate-500 text-sm">คุณยังไม่มีเพื่อนในรายชื่อ</p>
            </div>
          ` : `
            <div class="space-y-3 max-h-[500px] overflow-y-auto custom-scroll pr-2">
              ${friends.map(friend => `
                <div class="p-3 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-3 hover:border-[#007a7a]/30 transition-colors">
                  <div class="flex items-center gap-3 min-w-0">
                    <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-teal-500 to-[#f2994a] flex items-center justify-center font-bold text-white shrink-0 shadow-sm">
                      ${friend.username ? friend.username.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div class="min-w-0">
                      <p class="text-sm font-bold text-slate-800 truncate">@${friend.username}</p>
                      ${friend.role === 'family'
      ? `<span class="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-600 font-bold border border-purple-200 mt-0.5"><i data-lucide="home" class="w-3 h-3"></i> ครอบครัว (ดูปฏิทินได้)</span>`
      : `<span class="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 font-bold border border-slate-200 mt-0.5"><i data-lucide="user" class="w-3 h-3"></i> เพื่อนทั่วไป</span>`
    }
                    </div>
                  </div>
                  
                  <div class="shrink-0 flex items-center gap-2">
                    <select onchange="changeFriendRole('${friend.id}', this.value)" class="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#007a7a] cursor-pointer">
                      <option value="friend" ${friend.role === 'friend' ? 'selected' : ''}>เพื่อนปกติ</option>
                      <option value="family" ${friend.role === 'family' ? 'selected' : ''}>ครอบครัว</option>
                    </select>
                    
                    <button onclick="handleRemoveFriend('${friend.id}', '${friend.username}')" class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors" title="ลบเพื่อน">
                      <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      </div>
    </div>
  `;
}
