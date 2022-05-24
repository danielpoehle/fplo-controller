(function () {
    'use strict'; 

    angular.module('FploControl', [])
    .controller('FploController', FploController)
    .service('FploService', FploService);
    
    FploController.$inject = ['FploService'];
    function FploController(FploService) {
        let fploList = this;

        fploList.Filename = 'bla';        
        fploList.loadComplete = false;
        fploList.startDate = luxon.DateTime.now();   
        fploList.selectedYear = fploList.startDate.year;
        fploList.currentWeek = fploList.startDate.weekNumber;
        fploList.ABFKInstance = [];
        fploList.KanBan = [];
        fploList.Work = [];

       
        fploList.showWork = function(){
            fploList.Work = [];
            if(fploList.KanBan.length > 0 && fploList.ABFKInstance.length > 0){                
                for (let kw = fploList.currentWeek-4; kw < fploList.currentWeek+4; kw+=1) { 
                    if(kw < 1 || kw > 52){continue;}

                    let abfk = fploList.ABFKInstance.filter((a) => a.BOB_DATE.Year === fploList.selectedYear && 
                                                                   a.BOB_DATE.KW === kw &&
                                                                   a.Vorgang >= 50000 && a.Vorgang < 60000 &&
                                                                   (a['Trassen FPLO'] + a['Trassen ÜB'] > 0));
                    //console.log(abfk);
                    let vorgang = abfk.map((a) => a.Vorgang);
                    vorgang = vorgang.filter((item, index) => vorgang.indexOf(item)===index);
                    let vgList = [];
                    for (let j = 0; j < vorgang.length; j+=1) {                        
                        let vg = abfk.filter((a) => a.Vorgang === vorgang[j]);
                        let tr_fplo = vg.map((a) => a['Trassen FPLO']).reduce((partialSum, a) => partialSum + a, 0);
                        let done_fplo = vg.map((a) => a['Fertig FPLO']).reduce((partialSum, a) => partialSum + a, 0);
                        let tr_ub = vg.map((a) => a['Trassen ÜB']).reduce((partialSum, a) => partialSum + a, 0);
                        let done_ub = vg.map((a) => a['Fertig ÜB']).reduce((partialSum, a) => partialSum + a, 0);
                        for (let k = 0; k < vg.length; k+=1) {
                            let staff = 'Kanban fehlt!';
                            let sel_kanban = fploList.KanBan.findIndex((a) => a.Vorgang === vg[k].Vorgang &&
                                                                     a.EVU === vg[k]['EVU Gruppe'] &&
                                                                     a['Fahrplan-\njahr'] === fploList.selectedYear);
                            
                            if(sel_kanban >= 0){staff = fploList.KanBan[sel_kanban].Bearbeiter;}
                            vg[k].Staff = staff;
                        }
                        vgList.push({
                            'ANZ_DOK': vg.length,
                            'VORGANG': vorgang[j],
                            'TR_FPLO': tr_fplo,
                            'OPEN_FPLO': tr_fplo - done_fplo,
                            'TR_UB': tr_ub,
                            'OPEN_UB': tr_ub - done_ub,
                            'DOK': vg
                        });
                    }
                    let sum_dok = vgList.map((a) => a.ANZ_DOK).reduce((partialSum, a) => partialSum + a, 0);
                    fploList.Work.push({
                        'KW': kw,
                        'ANZ_MN': vorgang.length,
                        'SUM_DOK': sum_dok,
                        'MN': vgList
                    });
                }
                fploList.loadComplete = true;
                //console.log(fploList.Work);
            }else{
                console.log("At least one selected list is empty.");
            }
        };
        

        $(document).ready(function () {
            $('#list').bind('change', handleABFK);
            $('#tbl').bind('change', handleKanBan);
        });

        async function handleABFK(e) {
            const file = e.target.files[0];
            const data = await file.arrayBuffer();
            /* data is an ArrayBuffer */
            const workbook = XLSX.read(data);

            let df = XLSX.utils.sheet_to_json(workbook.Sheets['Sheet']);
            for (let i = 0; i < df.length; i+= 1) {
                const element = df[i];
                const origTxt = element['Bob Soll'];
                let tm = luxon.DateTime.fromFormat(origTxt, 'EEEE, d. MMMM yyyy', { locale: 'de-DE' });
                df[i]['BOB_DATE'] = {'DText': tm.toLocaleString(), 'DNumber': tm.ts, 'Original': origTxt, 'KW': tm.weekNumber, 'Year': tm.year};
            }
          
            /* DO SOMETHING WITH workbook HERE */ 
            //console.log(df[0]);           
            fploList.ABFKInstance = df;
          };

          async function handleKanBan(e) {
            const file = e.target.files[0];
            const data = await file.arrayBuffer();
            /* data is an ArrayBuffer */
            const workbook = XLSX.read(data);

            let range = XLSX.utils.decode_range(workbook.Sheets['MA_Arbeitssteuerung']['!ref']);
            range.s.r = 1; // <-- zero-indexed, so setting to 1 will skip row 0
            workbook.Sheets['MA_Arbeitssteuerung']['!ref'] = XLSX.utils.encode_range(range);

            let df = XLSX.utils.sheet_to_json(workbook.Sheets['MA_Arbeitssteuerung']);
            
          
            /* DO SOMETHING WITH workbook HERE */            
            console.log(df);
            fploList.KanBan = df;
            console.log(Object.keys(fploList.KanBan[0]));
          };
             
    };

    function FploService(){
        let service = this;
    };

})();