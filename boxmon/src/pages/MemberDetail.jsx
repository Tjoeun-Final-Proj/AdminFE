import React from 'react';
import '../styles/MemberMgmt.css';

function getBadgeClass(role) {
  if (role === '차주') return 'driver';
  if (role === '화주') return 'shipper';
  if (role === '관리자') return 'admin';
  return '';
}

function formatDateTime(str) {
  if (!str) return '-';
  const d = new Date(str);
  return Number.isNaN(d.getTime()) ? str : d.toLocaleString('ko-KR');
}

function DetailRow({ label, value }) {
  return (
    <div className="member-detail-row">
      <span className="member-detail-label">{label}</span>
      <span>{value}</span>
    </div>
  );
}

const MemberDetail = ({ selectedMember, memberDetail, memberDetailLoading, memberDetailError, onBack, onSuspend, onRestore, suspendLoading, penaltyList, penaltyListLoading, onAddPenalty, onDeletePenalty, penaltyDeletingId }) => {
  if (!selectedMember) return null;

  const userId = selectedMember.userId ?? selectedMember.id;
  const isUser = selectedMember.role === '차주' || selectedMember.role === '화주';
  const isActive = memberDetail?.accountStatus === true;

  const handleSuspend = () => {
    if (!window.confirm('해당 사용자를 계정 정지하시겠습니까?')) return;
    onSuspend?.(userId);
  };

  const handleRestore = () => {
    if (!window.confirm('해당 사용자 계정을 복구하시겠습니까?')) return;
    onRestore?.(userId);
  };

  return (
    <div className="member-detail">
      <button type="button" className="member-detail-back" onClick={onBack}>
        ← 목록으로
      </button>
      <div className="member-detail-header-row">
        <h2 className="member-detail-title">회원 상세</h2>
        {isUser && memberDetail && (
          <>
            {isActive ? (
              <button type="button" className="member-detail-suspend-btn" onClick={handleSuspend} disabled={suspendLoading}>
                {suspendLoading ? '처리 중...' : '계정 정지'}
              </button>
            ) : (
              <button type="button" className="member-detail-restore-btn" onClick={handleRestore} disabled={suspendLoading}>
                {suspendLoading ? '처리 중...' : '계정 복구'}
              </button>
            )}
          </>
        )}
      </div>

      {selectedMember.role === '관리자' && (
        <div className="member-detail-card">
          <DetailRow label="구분" value={<span className={`table-badge ${getBadgeClass(selectedMember.role)}`}>{selectedMember.role}</span>} />
          <DetailRow label="성명" value={`${selectedMember.name}님`} />
          <DetailRow label="아이디" value={selectedMember.displayId ?? selectedMember.id} />
        </div>
      )}

      {(selectedMember.role === '차주' || selectedMember.role === '화주') && (
        <>
          {memberDetailLoading && <p className="member-detail-loading">상세 정보 로딩 중...</p>}
          {memberDetailError && <p className="member-detail-error">{memberDetailError}</p>}
          {!memberDetailLoading && memberDetail && (
            <div className="member-detail-card">
              <DetailRow label="구분" value={<span className={`table-badge ${getBadgeClass(selectedMember.role)}`}>{selectedMember.role}</span>} />
              <DetailRow label="이메일" value={memberDetail.email ?? '-'} />
              <DetailRow label="이름" value={memberDetail.name ?? '-'} />
              <DetailRow label="연락처" value={memberDetail.phone ?? '-'} />
              <DetailRow label="생년월일" value={memberDetail.birth ?? '-'} />
              <DetailRow label="가입일" value={memberDetail.createdAt ? formatDateTime(memberDetail.createdAt) : '-'} />
              <DetailRow label="푸시알림" value={memberDetail.isPushEnabled === true ? '사용' : memberDetail.isPushEnabled === false ? '미사용' : '-'} />
              <DetailRow label="사업자번호" value={memberDetail.businessNumber ?? '-'} />
              <DetailRow label="계정상태" value={memberDetail.accountStatus === true ? '활성' : memberDetail.accountStatus === false ? '비활성' : '-'} />
              {selectedMember.role === '차주' && (
                <>
                  <DetailRow label="은행코드" value={memberDetail.bankCode ?? '-'} />
                  <DetailRow label="계좌번호" value={memberDetail.accountNumber ?? '-'} />
                  <DetailRow label="예금주" value={memberDetail.holderName ?? '-'} />
                  <DetailRow label="인증번호" value={memberDetail.certNumber ?? '-'} />
                  <DetailRow label="차량번호" value={memberDetail.vehicleNumber ?? '-'} />
                  <DetailRow label="차량유형" value={memberDetail.vehicleType ?? '-'} />
                  <DetailRow label="냉장" value={memberDetail.vehicleNumber == null ? '-' : (memberDetail.canRefrigerate === true ? '가능' : '불가')} />
                  <DetailRow label="냉동" value={memberDetail.vehicleNumber == null ? '-' : (memberDetail.canFreeze === true ? '가능' : '불가')} />
                  <DetailRow label="적재중량(톤)" value={memberDetail.weightCapacity != null ? String(memberDetail.weightCapacity) : '-'} />
                </>
              )}
            </div>
          )}
          {!memberDetailLoading && !memberDetail && (
            <div className="member-detail-card">
              <p className="member-detail-fallback-caption">목록 정보 (상세 API 미연동 시 표시)</p>
              <DetailRow label="구분" value={<span className={`table-badge ${getBadgeClass(selectedMember.role)}`}>{selectedMember.role}</span>} />
              <DetailRow label="이메일/아이디" value={selectedMember.displayId ?? selectedMember.id ?? '-'} />
              <DetailRow label="이름" value={selectedMember.name ?? '-'} />
              <DetailRow label="연락처" value={selectedMember.phone ?? '-'} />
              <DetailRow label="생년월일" value={selectedMember.birth ?? '-'} />
              <DetailRow label="가입일" value={selectedMember.joinDate ?? '-'} />
            </div>
          )}
          {isUser && memberDetail && (
            <>
              <div className="member-detail-penalty-section">
                <div className="member-detail-penalty-header">
                  <span className="member-detail-penalty-title">경고</span>
                  <button type="button" className="member-detail-penalty-add-btn" onClick={onAddPenalty}>
                    경고추가
                  </button>
                </div>
                <div className="member-detail-penalty-table-wrap">
                  <table className="member-detail-penalty-table">
                    <thead>
                      <tr>
                        <th>경고 번호</th>
                        <th>사유</th>
                        <th>등록 일시</th>
                        <th style={{ width: 90 }} />
                      </tr>
                    </thead>
                    <tbody>
                      {penaltyListLoading ? (
                        <tr>
                          <td colSpan={4} className="member-detail-penalty-empty">경고 목록 로딩 중...</td>
                        </tr>
                      ) : (penaltyList || []).length === 0 ? (
                        <tr>
                          <td colSpan={4} className="member-detail-penalty-empty">등록된 경고가 없습니다.</td>
                        </tr>
                      ) : (
                        (penaltyList || []).map((p) => {
                          const pid = p.penaltyId ?? p.id;
                          const isDeleting = penaltyDeletingId === pid;
                          return (
                            <tr key={pid}>
                              <td>{pid ?? '-'}</td>
                              <td>{p.payload ?? p.reason ?? p.content ?? '-'}</td>
                              <td>{p.createdAt ? formatDateTime(p.createdAt) : '-'}</td>
                              <td>
                                <button type="button" className="member-detail-penalty-delete-btn" onClick={() => onDeletePenalty?.(pid)} disabled={isDeleting}>
                                  {isDeleting ? '삭제 중...' : '삭제'}
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default MemberDetail;
