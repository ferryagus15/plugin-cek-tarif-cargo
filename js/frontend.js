(function(){
    // Data entries: array objek {kotaAwal, kotaTujuan, layanan, biaya, estimasi}
    let dataEntries = [];

    // DOM Elements
    const inputAsalCek = document.getElementById('inputAsalCek');
    const listAsal = document.getElementById('listAsal');
    const inputTujuanCek = document.getElementById('inputTujuanCek');
    const listTujuan = document.getElementById('listTujuan');
    const outputCekTarif = document.getElementById('outputCekTarif');
    const selectLayananCek = document.getElementById('selectLayananCek');
    const inputBerat = document.getElementById('inputBerat');
    const btnHitung = document.getElementById('btnHitung');

    // Fetch data from API
    function fetchData(){
        jQuery.ajax({
            url: ajaxurl,
            method: 'POST',
            data: { action: 'get_tarif_cargo' },
            success: function(response){
                if(response.success){
                    dataEntries = response.data;
                    initAutocompleteCekTarif();
                } else {
                    outputCekTarif.innerHTML = '<div class="error">Gagal memuat data tarif.</div>';
                }
            },
            error: function(){
                outputCekTarif.innerHTML = '<div class="error">Terjadi kesalahan saat memuat data tarif.</div>';
            }
        });
    }

    // untuk autocomplete cek tarif, gunakan unik kota dengan filter dari dataEntries
    function getUniqueKota(isAwal){
        const setKota = new Set();
        dataEntries.forEach(e => {
            if(isAwal) setKota.add(e.kotaAwal);
            else setKota.add(e.kotaTujuan);
        });
        return Array.from(setKota).sort();
    }

    function initAutocompleteCek(inputEl, listEl, candidates){
        let currentFocus = -1;
        inputEl.addEventListener('input', function(){
            const val = this.value.trim().toLowerCase();
            closeAllLists();
            if(!val) return;
            listEl.style.display = 'block';
            listEl.setAttribute('aria-expanded', 'true');
            let count = 0;
            candidates.forEach(cand => {
                if(cand.toLowerCase().includes(val) || cand.toLowerCase().startsWith(val)) {
                    const item = document.createElement('div');
                    item.textContent = cand;
                    item.setAttribute('role','option');
                    item.addEventListener('click', () => {
                        inputEl.value = cand;
                        closeAllLists();
                    });
                    listEl.appendChild(item);
                    count++;
                }
            });
            if(count === 0) {
                const noItem = document.createElement('div');
                noItem.textContent = 'Tidak ditemukan';
                noItem.style.fontStyle = 'italic';
                listEl.appendChild(noItem);
            }
        });
        inputEl.addEventListener('keydown', function(e){
            const items = listEl.getElementsByTagName('div');
            if(e.key === 'ArrowDown') {
                currentFocus++;
                addActive(items);
                e.preventDefault();
            } else if(e.key === 'ArrowUp') {
                currentFocus--;
                addActive(items);
                e.preventDefault();
            } else if(e.key === 'Enter') {
                e.preventDefault();
                if(currentFocus > -1 && items[currentFocus]){
                    items[currentFocus].click();
                }
            }
        });
        function addActive(items){
            if(!items) return false;
            removeActive(items);
            if(currentFocus >= items.length) currentFocus = 0;
            if(currentFocus < 0) currentFocus = items.length -1;
            items[currentFocus].classList.add('autocomplete-active');
        }
        function removeActive(items){
            Array.from(items).forEach(item=>item.classList.remove('autocomplete-active'));
        }
        function closeAllLists(){
            while(listEl.firstChild){
                listEl.removeChild(listEl.firstChild);
            }
            listEl.style.display = 'none';
            listEl.setAttribute('aria-expanded', 'false');
            currentFocus = -1;
        }
        document.addEventListener('click', function(e){
            if(e.target !== inputEl && e.target.parentNode !== listEl){
                closeAllLists();
            }
        });
    }

    // Inisialisasi autocomplete cek tarif
    function initAutocompleteCekTarif(){
        const unikKotaAwal = getUniqueKota(true);
        const unikKotaTujuan = getUniqueKota(false);
        initAutocompleteCek(inputAsalCek, listAsal, unikKotaAwal);
        initAutocompleteCek(inputTujuanCek, listTujuan, unikKotaTujuan);
    }

    btnHitung.addEventListener('click', () => {
        outputCekTarif.innerHTML = '';
        const asal = inputAsalCek.value.trim();
        const tujuan = inputTujuanCek.value.trim();
        const layanan = selectLayananCek.value;
        let beratRaw = inputBerat.value.trim();

        if(!asal || !tujuan){
            outputCekTarif.innerHTML = '<div class="error">Mohon isi Kota Awal dan Kota Tujuan.</div>';
            return;
        }
        if(asal.toLowerCase() === tujuan.toLowerCase()){
            outputCekTarif.innerHTML = '<div class="error">Kota Awal dan Kota Tujuan tidak boleh sama.</div>';
            return;
        }

        // Cari entry tarif yang cocok
        const foundEntry = dataEntries.find(e =>
            e.kotaAwal.toLowerCase() === asal.toLowerCase() &&
            e.kotaTujuan.toLowerCase() === tujuan.toLowerCase() &&
            e.layanan === layanan
        );
        if(!foundEntry){
            outputCekTarif.innerHTML = `<div class="error">Tarif untuk rute ${asal} → ${tujuan} dengan layanan ${layanan} belum tersedia.</div>`;
            return;
        }
        if(!beratRaw || isNaN(beratRaw) || Number(beratRaw) <= 0){
            outputCekTarif.innerHTML = '<div class="error">Masukkan berat barang yang valid (lebih dari 0).</div>';
            return;
        }
        const berat = Number(beratRaw);
        const beratHitung = berat < 10 ? 10 : berat;

        // Tambah kata "hari" otomatis ke estimasi jika belum ada
        let estimasiText = foundEntry.estimasi.trim();
        if(!estimasiText.endsWith('hari')){
            estimasiText = estimasiText + ' hari';
        }

        const totalBiaya = beratHitung * foundEntry.biaya;
        const formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' });
        const biayaFormatted = formatter.format(totalBiaya);

outputCekTarif.innerHTML = `
    <div class="tarif-result">
        <table class="tarif-table">
            <thead>
                <tr>
                    <th>Kota Awal</th>
                    <th>Kota Tujuan</th>
                    <th>Layanan</th>
                    <th>Tarif Per Kg</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>${foundEntry.kotaAwal}</td>
                    <td>${foundEntry.kotaTujuan}</td>
                    <td>${foundEntry.layanan.charAt(0).toUpperCase() + foundEntry.layanan.slice(1)}</td>
                    <td>${formatter.format(foundEntry.biaya)}</td>
                </tr>
            </tbody>
        </table>
        
        <div class="tarif-summary">
            <p><strong>Berat:</strong> ${berat} Kg (dibulatkan ke ${beratHitung} Kg)</p>
            <p><strong>Total Biaya:</strong> ${biayaFormatted}</p>
            <p><strong>Estimasi:</strong> ${estimasiText}</p>
        </div>
    </div>
`;
    });

    // Reset button functionality for Cek Tarif form
    const btnResetCekTarif = document.getElementById('btnResetCekTarif');
    btnResetCekTarif.addEventListener('click', () => {
        inputAsalCek.value = '';
        inputTujuanCek.value = '';
        selectLayananCek.value = 'port';
        inputBerat.value = '';
        outputCekTarif.innerHTML = '';
    });

    // Inisialisasi awal
    fetchData();

})();