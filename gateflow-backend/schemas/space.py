"""schemas/space.py — Space request/response schemas"""
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field, field_validator, model_validator
from models.space import SpaceType


class CreateSpaceRequest(BaseModel):
    type: SpaceType
    name: str = Field(..., min_length=1, max_length=200)
    venue: Optional[str] = Field(None, max_length=300)
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    address: Optional[str] = Field(None, max_length=400)
    walkin_enabled: bool = True
    max_guests: Optional[int] = None

    @field_validator("name")
    @classmethod
    def name_not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("name cannot be blank")
        return v.strip()

    @field_validator("max_guests")
    @classmethod
    def positive_guests(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and v <= 0:
            raise ValueError("max_guests must be positive")
        return v

    @model_validator(mode="after")
    def validate_by_type(self) -> "CreateSpaceRequest":
        if self.type == SpaceType.EVENT:
            if not self.start_time:
                raise ValueError("start_time required for EVENT")
            if not self.end_time:
                raise ValueError("end_time required for EVENT")
            if self.end_time <= self.start_time:
                raise ValueError("end_time must be after start_time")
        if self.type == SpaceType.APARTMENT:
            if not self.address or not self.address.strip():
                raise ValueError("address required for APARTMENT")
        return self


class UpdateSpaceRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    venue: Optional[str] = Field(None, max_length=300)
    address: Optional[str] = Field(None, max_length=400)
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    walkin_enabled: Optional[bool] = None
    max_guests: Optional[int] = None

    @model_validator(mode="after")
    def validate_times(self) -> "UpdateSpaceRequest":
        if self.start_time and self.end_time and self.end_time <= self.start_time:
            raise ValueError("end_time must be after start_time")
        return self


class SpaceResponse(BaseModel):
    id: UUID
    type: SpaceType
    name: str
    owner_id: UUID
    venue: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    address: Optional[str] = None
    walkin_enabled: bool
    max_guests: Optional[int] = None
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    model_config = {"from_attributes": True}


class SpaceListResponse(BaseModel):
    total: int
    spaces: list[SpaceResponse]
