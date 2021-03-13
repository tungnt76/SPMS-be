const titles = {
  CHUONG_TRINH_DAO_TAO: 'chương trình đào tạo',
  TEN_CHUONG_TRINH: 'tên chương trình',
  TRINH_DO_DAI_HOC: 'trình đồ đại học',
  NGANH_DAO_TAO: 'ngành đào tạo',
  MA_NGANH: 'mã ngành',
  LOAI_HINH_DAO_TAO: 'loại hình đào tạo',
  KHOA_TUYEN: 'khóa tuyển',
  MUC_TIEU_DAO_TAO: 'mục tiêu đào tạo',
  MUC_TIEU_CHUNG: 'mục tiêu chung',
  MUC_TIEU_CU_THE: 'mục tiêu cụ thể',
  CO_HOI_NGHE_NGHIEP: 'cơ hội nghề nghiệp',
  THOI_GIAN_DAO_TAO: 'thời gian đào tạo',
  KHOI_LUONG_KIEN_THUC: 'khối lượng kiến thức toàn khóa',
  DOI_TUONG_TUYEN_SINH: 'đối tượng tuyển sinh',
  QUY_TRINH_DAO_TAO_DIEU_KIEN_TOT_NGHIEP: 'quy trình đào tạo, điều kiến tốt nghiệp',
  QUY_TRINH_DAO_TAO: 'quy trình đào tạo',
  DIEU_KIEN_TOT_NGHIEP: 'điều kiện tốt nghiệp',
  CAU_TRUC_CHUONG_TRINH: 'cấu trúc chương trình',
  NOI_DUNG_CHUONG_TRINH: 'nội dung chương trình',
  KE_HOACH_GIANG_DAY: 'kế hoạch giảng dạy'
};
export default (data) => `
<!DOCTYPE html>
<html>
     <head>
          <link rel="stylesheet"
      href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css">
      <style>
           ol {
               list-style-type: none;
               counter-reset: item;
               margin: 0;
               padding: 0;
          }

          ol > li {
               display: table;
               counter-increment: item;
               margin-bottom: 0.6em;
          }

          ol > li:before {
               content: counters(item, ".") ". ";
               display: table-cell;
               padding-right: 0.6em;  
               font-weight: 700;  
          }

          li ol > li {
               margin: 0;
          }

          li ol > li:before {
               content: counters(item, ".") " ";
               font-weight: 700;
          }
      </style>
      <style>
          .row{
               margin: 5px
          }

           .titleChuongTrinhDaoTao{
                text-align: center;
           }
           .titleChuongTrinhDaoTao h2{
                font-weight: 700;
                font-size: 26px;
                text-transform: uppercase;
           }
           .table-info{
               display: -webkit-box; 
               display: flex;
           }
           .table-title,.table-value{
                text-transform: capitalize;
           }
           .table-value{
                margin-left: 20px;
           }
           .block-info{
               display: flex;
               display: -webkit-flex;
           }
           .part-title{
                text-transform: uppercase;
                font-size: 15px;
                font-weight: 700;
           }
      </style>
     </head>
     <body>
          <div class="wrapper">
               <div class="container-fluid" style="font-family: sans-serif">
                    <div class="row top">
                         <div class="container">
                              <div class="row titleChuongTrinhDaoTao">
                                   <h2>${titles.CHUONG_TRINH_DAO_TAO}</h2>
                                   <h2>ngành công nghệ phần mềm</h2>
                              </div>
                              <div class="row">
                                   <div class="table-info" style="width: 100%;">
                                        <div class="table-title">
                                             <p>${titles.TEN_CHUONG_TRINH}:</p>
                                             <p>${titles.TRINH_DO_DAI_HOC}:</p>
                                             <p>${titles.NGANH_DAO_TAO}:</p>
                                             <p>${titles.MA_NGANH}:</p>
                                             <p>${titles.LOAI_HINH_DAO_TAO}:</p>
                                             <p>${titles.KHOA_TUYEN}:</p>
                                        </div>
                                        <div class="table-value">
                                             <p class="block-value">cong nghe phan mem</p>
                                             <p class="block-value">đại học</p>
                                             <p class="block-value">ky thuat phan mem</p>
                                             <p class="block-value">D123</p>
                                             <p class="block-value">chinh quy</p>
                                             <p class="block-value">2016</p>
                                        </div>
                                   </div>
                              </div>
                         </div>
                    </div>
                    <div class="row">
                         <div class="container">
                              <div class="row">
                                   <ol>
                                        <li class="li-menu-lv1">
                                             <p class="part-title">${titles.MUC_TIEU_DAO_TAO}</p>
                                             
                                             <ol>
                                                  <li class="li-menu-lv2">
                                                       <p class="part-title">${titles.MUC_TIEU_CHUNG}</p>
                                                       <div class="row muctieuchung">
                                                            <p>text.............</p>
                                                       </div>
                                                  </li>
                                                  <li class="li-menu-lv2">
                                                       <p class="part-title">${titles.MUC_TIEU_CU_THE}</p>
                                                       <div class="row muctieucuthe">
                                                            <p>text.............</p>
                                                       </div>
                                                  </li>
                                                  <li class="li-menu-lv2">
                                                       <p class="part-title">${titles.CO_HOI_NGHE_NGHIEP}</p>
                                                       <div class="row cohoinghenghiep">
                                                            <p>text.............</p>
                                                       </div>
                                                  </li>
                                             </ol>
                                        </li>

                                        <li class="li-menu-lv1"><p class="part-title">${titles.THOI_GIAN_DAO_TAO}</p></li>
                                        <li class="li-menu-lv1"><p class="part-title">${titles.KHOI_LUONG_KIEN_THUC}</p></li>
                                        <li class="li-menu-lv1"><p class="part-title">${titles.DOI_TUONG_TUYEN_SINH}</p></li>
                                        <li class="li-menu-lv1">
                                             <p class="part-title">${titles.QUY_TRINH_DAO_TAO_DIEU_KIEN_TOT_NGHIEP}</p>
                                        
                                             <ol>
                                                  <li class="li-menu-lv2">
                                                       <p class="part-title">${titles.QUY_TRINH_DAO_TAO}</p>
                                                       <div class="row quytrinhdaotao">
                                                            <p>text.............</p>
                                                       </div>
                                                  </li>
                                                  <li class="li-menu-lv2">
                                                       <p class="part-title">${titles.DIEU_KIEN_TOT_NGHIEP}</p>
                                                       <div class="row dieukientotnghiep">
                                                            <p>text.............</p>
                                                       </div>
                                                  </li>
                                             </ol>
                                        </li>
                                        <li class="li-menu-lv1"><p class="part-title">${titles.CAU_TRUC_CHUONG_TRINH}</p></li>
                                        <li class="li-menu-lv1">
                                             <p class="part-title">${titles.CAU_TRUC_CHUONG_TRINH}</p>
                                        
                                             <ol>
                                                  <li class="li-menu-lv2">
                                                       <p class="part-title">kien thuc giao duc dai cuong</p>
                                                       <div class="row kienthucgiaoducdaicuong">
                                                            <p>text.............</p>
                                                       </div>
                                                  </li>
                                                  <li class="li-menu-lv2">
                                                       <p class="part-title">kien thuc chuyen nghiep</p>
                                                       <div class="row kienthuctotnghiep">
                                                            <p>text.............</p>
                                                       </div>
                                                  </li>
                                             </ol>
                                        </li>
                                        <li class="li-menu-lv1"><p class="part-title">${titles.KE_HOACH_GIANG_DAY}</p></li>
                                   </ol>
                              </div>
                         </div>
                    </div>
                    
               </div>
          </div>
     </body>
</html>

`;
