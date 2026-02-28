from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from .. import crud, schemas, models
from ..database import get_db
from ..dependencies import get_current_active_user

# 创建路由
router = APIRouter(
    prefix="/column-seq",
    tags=["column-seq"],
    responses={404: {"description": "Not found"}},
)

@router.get("/", response_model=List[schemas.ColumnSeq])
def read_column_seqs(
    cat1_code: Optional[str] = Query(None, description="工段类别编码"),
    cat2_code: Optional[str] = Query(None, description="工序类别编码"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """获取列顺序列表，可按工段类别和工序类别过滤"""
    if cat1_code and cat2_code:
        return crud.get_column_seq_by_combination(db, cat1_code, cat2_code)
    elif cat1_code:
        # 当只提供 cat1_code 时，过滤该工段类别的所有记录
        return db.query(models.ColumnSeq).filter(
            models.ColumnSeq.cat1_code == cat1_code
        ).order_by(models.ColumnSeq.seq).all()
    return crud.get_column_seq_list(db, skip=skip, limit=limit)

@router.get("/{id}", response_model=schemas.ColumnSeq)
def read_column_seq(
    id: int,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """根据ID获取列顺序"""
    column_seq = crud.get_column_seq_by_id(db, id=id)
    if not column_seq:
        raise HTTPException(status_code=404, detail="Column sequence not found")
    return column_seq

@router.post("/", response_model=schemas.ColumnSeq, status_code=201)
def create_column_seq(
    column_seq: schemas.ColumnSeqCreate,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """创建列顺序"""
    return crud.create_column_seq(db=db, column_seq=column_seq)

@router.put("/{id}", response_model=schemas.ColumnSeq)
def update_column_seq(
    id: int,
    column_seq_update: schemas.ColumnSeqUpdate,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """更新列顺序"""
    column_seq = crud.update_column_seq(db, id=id, column_seq_update=column_seq_update)
    if not column_seq:
        raise HTTPException(status_code=404, detail="Column sequence not found")
    return column_seq

@router.delete("/{id}")
def delete_column_seq(
    id: int,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_active_user)
):
    """删除列顺序"""
    column_seq = crud.delete_column_seq(db, id=id)
    if not column_seq:
        raise HTTPException(status_code=404, detail="Column sequence not found")
    return {"message": "列顺序删除成功", "id": id}
