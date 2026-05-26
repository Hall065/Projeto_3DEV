<?php

namespace App\Models\Concerns;

use App\Models\HubPerson;
use Illuminate\Database\Eloquent\Builder;

/**
 * Prefer hub_people for identity fields; legacy columns remain for writes/backfill.
 */
trait ResolvesProfileFromHubPerson
{
    protected function profileFromHub(): ?HubPerson
    {
        if ($this->relationLoaded('hubPerson')) {
            return $this->hubPerson;
        }

        if ($this->hub_person_id) {
            return $this->hubPerson;
        }

        return null;
    }

    public function getFullNameAttribute(?string $value): ?string
    {
        return $this->profileFromHub()?->full_name ?? $value;
    }

    public function getEmailAttribute(?string $value): ?string
    {
        return $this->profileFromHub()?->email ?? $value;
    }

    public function getCpfAttribute(?string $value): ?string
    {
        return $this->profileFromHub()?->cpf ?? $value;
    }

    public function getPhoneAttribute(?string $value): ?string
    {
        return $this->profileFromHub()?->phone ?? $value;
    }

    public function getRegistrationNumberAttribute(?string $value): ?string
    {
        return $this->profileFromHub()?->registration_number ?? $value;
    }

    public function getBirthDateAttribute($value)
    {
        $fromHub = $this->profileFromHub()?->birth_date;

        return $fromHub ?? $value;
    }

    public function getSpecialtyAttribute(?string $value): ?string
    {
        return $this->profileFromHub()?->specialty ?? $value;
    }

    public function getStatusAttribute(?string $value): ?string
    {
        return $this->profileFromHub()?->status ?? $value;
    }

    /**
     * @param  Builder<static>  $query
     */
    public function scopeWhereProfileMatches(Builder $query, string $search, array $columns = ['full_name', 'email']): Builder
    {
        return $query->where(function (Builder $builder) use ($search, $columns): void {
            foreach ($columns as $column) {
                $builder->orWhere($column, 'like', "%{$search}%");
            }

            $builder->orWhereHas('hubPerson', function (Builder $person) use ($search, $columns): void {
                foreach ($columns as $column) {
                    $person->orWhere($column, 'like', "%{$search}%");
                }
            });
        });
    }
}
